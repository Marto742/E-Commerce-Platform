import 'dotenv/config'
import { reindexAllProducts } from '../lib/search-indexer'
import { setupSearchSchema } from '../lib/search-schema'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('Setting up search schema...')
  await setupSearchSchema()

  console.log('Indexing products...')
  const { indexed } = await reindexAllProducts()

  console.log(`Done. Indexed ${indexed} products.`)
}

main()
  .catch((err) => {
    console.error('Re-index failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
