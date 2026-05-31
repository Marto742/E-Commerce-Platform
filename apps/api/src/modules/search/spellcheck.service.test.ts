import { describe, it, expect } from 'vitest'
import { boundedLevenshtein, correctQuery, type Dictionary } from './spellcheck.service'

function dictionaryOf(terms: Record<string, [display: string, freq: number]>): Dictionary {
  return new Map(Object.entries(terms).map(([key, [display, freq]]) => [key, { display, freq }]))
}

const dict = dictionaryOf({
  iphone: ['iPhone', 5],
  galaxy: ['Galaxy', 3],
  samsung: ['Samsung', 3],
  laptop: ['Laptop', 4],
  smartphones: ['Smartphones', 2],
  pro: ['Pro', 6],
})

describe('boundedLevenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(boundedLevenshtein('iphone', 'iphone', 2)).toBe(0)
  })

  it('counts single edits', () => {
    expect(boundedLevenshtein('samsng', 'samsung', 2)).toBe(1) // insertion
    expect(boundedLevenshtein('laptap', 'laptop', 2)).toBe(1) // substitution
  })

  it('short-circuits past the max with max + 1', () => {
    expect(boundedLevenshtein('abcdef', 'iphone', 2)).toBe(3)
  })
})

describe('correctQuery', () => {
  it('returns null when the token is a known term', () => {
    expect(correctQuery('iphone', dict)).toBeNull()
  })

  it('corrects a transposition typo', () => {
    expect(correctQuery('ihpone', dict)).toBe('iPhone')
  })

  it('corrects a missing-letter typo', () => {
    expect(correctQuery('samsng', dict)).toBe('Samsung')
  })

  it('only rewrites the mistyped token in a multi-word query', () => {
    expect(correctQuery('samsng galaxy', dict)).toBe('Samsung Galaxy')
  })

  it('leaves valid prefixes alone (partial typing)', () => {
    expect(correctQuery('lap', dict)).toBeNull()
  })

  it('ignores case-only differences', () => {
    expect(correctQuery('IPHONE', dict)).toBeNull()
  })

  it('returns null when nothing is close enough', () => {
    expect(correctQuery('zzzzzz', dict)).toBeNull()
  })

  it('does not try to correct very short tokens', () => {
    expect(correctQuery('ab', dict)).toBeNull()
  })

  it('returns null for an empty dictionary', () => {
    expect(correctQuery('iphone', new Map())).toBeNull()
  })
})
