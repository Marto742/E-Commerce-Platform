import type { Metadata } from 'next'
import { SearchResults } from './search-results'

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search results for "${q}"` : 'Search',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page = '1' } = await searchParams
  return <SearchResults query={q} page={parseInt(page, 10) || 1} />
}
