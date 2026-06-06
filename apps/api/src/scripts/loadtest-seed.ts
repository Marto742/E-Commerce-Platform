import 'dotenv/config'
import { meili } from '../lib/meilisearch'
import { PRODUCTS_INDEX, type ProductDocument } from '../lib/search-schema'

/**
 * Seeds the Meilisearch index with synthetic products for load testing, or
 * removes them with `clean`. Documents use the `lt-` id prefix so they can be
 * cleaned up without touching the real catalogue.
 *
 *   pnpm --filter @repo/api loadtest:seed          # add LOADTEST_COUNT docs
 *   pnpm --filter @repo/api loadtest:clean         # remove them
 */

const COUNT = Number(process.env.LOADTEST_COUNT ?? 10_000)
const BATCH = 1_000
const ID_PREFIX = 'lt-'
const isClean = process.argv.includes('clean')

const ADJECTIVES = [
  'Blue',
  'Red',
  'Black',
  'White',
  'Wireless',
  'Premium',
  'Classic',
  'Organic',
  'Leather',
  'Steel',
  'Cotton',
  'Smart',
  'Portable',
  'Vintage',
  'Modern',
  'Compact',
  'Ultra',
  'Eco',
  'Pro',
  'Lightweight',
]
const NOUNS = [
  'Headphones',
  'Speaker',
  'Backpack',
  'Jacket',
  'Watch',
  'Lamp',
  'Bottle',
  'Notebook',
  'Charger',
  'Mug',
  'Chair',
  'Keyboard',
  'Mouse',
  'Camera',
  'Sneakers',
  'Sunglasses',
  'Wallet',
  'Blender',
  'Toaster',
  'Monitor',
]
const CATEGORIES = [
  { id: 'lt-cat-electronics', name: 'Electronics' },
  { id: 'lt-cat-apparel', name: 'Apparel' },
  { id: 'lt-cat-home', name: 'Home & Kitchen' },
  { id: 'lt-cat-sports', name: 'Sports & Outdoors' },
  { id: 'lt-cat-beauty', name: 'Beauty' },
  { id: 'lt-cat-toys', name: 'Toys & Games' },
]

function buildDoc(i: number): ProductDocument {
  const adj = ADJECTIVES[i % ADJECTIVES.length]
  const adj2 = ADJECTIVES[(i * 7) % ADJECTIVES.length]
  const noun = NOUNS[(i * 3) % NOUNS.length]
  const category = CATEGORIES[i % CATEGORIES.length]

  const basePrice = Math.round((5 + ((i * 13) % 500)) * 100) / 100 + 0.99
  const rating = i % 6 === 0 ? 0 : Math.round((i % 51) / 10) // 0–5
  const name = `${adj} ${adj2} ${noun}`

  return {
    id: `${ID_PREFIX}${i}`,
    name,
    slug: `${ID_PREFIX}${i}`,
    description: `${name} — a ${adj.toLowerCase()} ${noun.toLowerCase()} for everyday use. Durable, ${adj2.toLowerCase()} and reliable.`,
    categoryId: category.id,
    categoryName: category.name,
    basePrice,
    comparePrice: i % 4 === 0 ? Math.round(basePrice * 1.2 * 100) / 100 : null,
    isActive: true,
    isFeatured: i % 10 === 0,
    imageUrl: null,
    skus: [`${ID_PREFIX.toUpperCase()}${i}`],
    variantNames: [adj2],
    minPrice: basePrice,
    maxPrice: Math.round(basePrice * 1.3 * 100) / 100,
    inStock: i % 7 !== 0,
    rating,
    reviewCount: rating > 0 ? i % 200 : 0,
    ratingBucket: Math.floor(rating),
    createdAt: Math.floor(Date.now() / 1000) - (i % 365) * 86_400,
  }
}

async function waitUntilIndexed(target: number): Promise<void> {
  const index = meili.index(PRODUCTS_INDEX)
  for (let attempt = 0; attempt < 120; attempt++) {
    const stats = await index.getStats()
    if (!stats.isIndexing && stats.numberOfDocuments >= target) return
    await new Promise((r) => setTimeout(r, 1_000))
  }
  console.warn('Timed out waiting for indexing to settle — continuing anyway.')
}

async function seed(): Promise<void> {
  const index = meili.index(PRODUCTS_INDEX)
  const before = (await index.getStats()).numberOfDocuments
  console.log(`Seeding ${COUNT.toLocaleString()} load-test products (index has ${before})…`)

  for (let start = 0; start < COUNT; start += BATCH) {
    const docs = Array.from({ length: Math.min(BATCH, COUNT - start) }, (_, k) =>
      buildDoc(start + k)
    )
    await index.addDocuments(docs, { primaryKey: 'id' })
    process.stdout.write(`  queued ${Math.min(start + BATCH, COUNT).toLocaleString()}\r`)
  }

  console.log('\nWaiting for Meilisearch to finish indexing…')
  await waitUntilIndexed(before + COUNT)
  const after = (await index.getStats()).numberOfDocuments
  console.log(`Done. Index now holds ${after.toLocaleString()} documents.`)
}

async function clean(): Promise<void> {
  const index = meili.index(PRODUCTS_INDEX)
  const ids = Array.from({ length: COUNT }, (_, i) => `${ID_PREFIX}${i}`)
  console.log(`Removing ${COUNT.toLocaleString()} load-test products…`)
  for (let start = 0; start < ids.length; start += 5_000) {
    await index.deleteDocuments(ids.slice(start, start + 5_000))
  }
  await new Promise((r) => setTimeout(r, 2_000))
  const after = (await index.getStats()).numberOfDocuments
  console.log(`Cleanup queued. Index now holds ~${after.toLocaleString()} documents.`)
}

const run = isClean ? clean : seed
run().catch((err) => {
  console.error('Load-test seeding failed:', err)
  process.exit(1)
})
