import { Meilisearch } from 'meilisearch'
import { env } from '@/config/env'

export const meili = new Meilisearch({
  host: env.MEILISEARCH_URL ?? 'http://localhost:7700',
  apiKey: env.MEILISEARCH_KEY ?? 'meilisearch-dev-key',
})
