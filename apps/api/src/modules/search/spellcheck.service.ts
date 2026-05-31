import { meili } from '@/lib/meilisearch'
import { PRODUCTS_INDEX, type ProductDocument } from '@/lib/search-schema'

/**
 * Lightweight "did you mean" spell checker.
 *
 * Meilisearch handles typo *tolerance* (matching despite typos) but has no
 * native spelling-suggestion API. We build a dictionary of the catalogue's
 * searchable terms and correct a mistyped query token to the nearest real term
 * by bounded edit distance. Suitable for modest catalogues — the dictionary is
 * pulled from the index and cached in memory.
 */

export type DictionaryEntry = { display: string; freq: number }
export type Dictionary = Map<string, DictionaryEntry>

const MIN_TOKEN_LENGTH = 3
const DICTIONARY_TTL_MS = 5 * 60_000

// ─── Tokenising ───────────────────────────────────────────────────────────────

/** Lowercased alphanumeric tokens — used for queries and dictionary keys. */
function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

/** Original-case alphanumeric tokens — used to preserve display casing. */
function rawTokens(text: string): string[] {
  return text.match(/[A-Za-z0-9]+/g) ?? []
}

// ─── Bounded Levenshtein ────────────────────────────────────────────────────

/** Edit distance between a and b, short-circuiting once it exceeds `max`. */
export function boundedLevenshtein(a: string, b: string, max: number): number {
  const al = a.length
  const bl = b.length
  if (Math.abs(al - bl) > max) return max + 1

  let prev = Array.from({ length: bl + 1 }, (_, j) => j)
  let curr = new Array<number>(bl + 1)

  for (let i = 1; i <= al; i++) {
    curr[0] = i
    let rowMin = curr[0]
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (curr[j] < rowMin) rowMin = curr[j]
    }
    if (rowMin > max) return max + 1
    ;[prev, curr] = [curr, prev]
  }
  return prev[bl]
}

// ─── Correction (pure) ─────────────────────────────────────────────────────

/**
 * Returns a corrected query, or null if no useful correction exists. A token is
 * left untouched when it is a known term or a prefix of one (valid partial
 * input); otherwise it is replaced with the closest term within edit distance.
 */
export function correctQuery(query: string, dict: Dictionary): string | null {
  const tokens = tokenize(query)
  if (tokens.length === 0 || dict.size === 0) return null

  const corrected = tokens.map((token) => {
    if (token.length < MIN_TOKEN_LENGTH) return token

    const exact = dict.get(token)
    if (exact) return exact.display

    // Shorter tokens are more typo-sensitive, so allow fewer edits.
    const maxDist = token.length <= 4 ? 1 : 2
    let isPrefix = false
    let best: { display: string; dist: number; freq: number } | null = null

    for (const [term, entry] of dict) {
      if (!isPrefix && term.startsWith(token)) isPrefix = true
      if (Math.abs(term.length - token.length) > maxDist) continue
      const dist = boundedLevenshtein(token, term, maxDist)
      if (dist > maxDist) continue
      if (!best || dist < best.dist || (dist === best.dist && entry.freq > best.freq)) {
        best = { display: entry.display, dist, freq: entry.freq }
      }
    }

    // A valid prefix of a real term (e.g. "lap" → "laptop") is intentional input.
    if (isPrefix) return token
    return best ? best.display : token
  })

  const suggestion = corrected.join(' ')
  // Ignore case-only differences (canonicalised casing isn't a "correction").
  return suggestion.toLowerCase() === tokens.join(' ') ? null : suggestion
}

// ─── Dictionary (cached) ──────────────────────────────────────────────────

let cache: { dict: Dictionary; builtAt: number } | null = null

/** Build a term-frequency dictionary from the searchable fields in the index. */
async function buildDictionary(): Promise<Dictionary> {
  const dict: Dictionary = new Map()
  const res = await meili.index<ProductDocument>(PRODUCTS_INDEX).search('', {
    limit: 1000,
    filter: 'isActive = true',
    attributesToRetrieve: ['name', 'categoryName', 'variantNames'],
  })

  for (const hit of res.hits) {
    const text = [hit.name, hit.categoryName, ...(hit.variantNames ?? [])].join(' ')
    for (const raw of rawTokens(text)) {
      if (raw.length < MIN_TOKEN_LENGTH) continue
      const key = raw.toLowerCase()
      const entry = dict.get(key)
      if (entry) entry.freq += 1
      else dict.set(key, { display: raw, freq: 1 })
    }
  }
  return dict
}

async function getDictionary(): Promise<Dictionary> {
  if (!cache || Date.now() - cache.builtAt > DICTIONARY_TTL_MS) {
    cache = { dict: await buildDictionary(), builtAt: Date.now() }
  }
  return cache.dict
}

/** Drop the cached dictionary (e.g. after a re-index). */
export function invalidateSpellcheckCache(): void {
  cache = null
}

/** "Did you mean" suggestion for a query, or null when none applies. */
export async function suggestCorrection(query: string): Promise<string | null> {
  try {
    return correctQuery(query, await getDictionary())
  } catch {
    // Spell check is best-effort — never fail the search because of it.
    return null
  }
}
