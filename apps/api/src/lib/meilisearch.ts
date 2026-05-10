import { Meilisearch } from 'meilisearch'

export const meili = new Meilisearch({
  host: process.env.MEILISEARCH_URL ?? 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_KEY ?? 'meilisearch-dev-key',
})
