import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchBar } from '../search-bar'

// Mock the hook so we don't hit the network
vi.mock('@/hooks/use-search-suggestions', () => ({
  useSearchSuggestions: vi.fn(() => ({ data: undefined, isFetching: false })),
}))

const { useSearchSuggestions } = await import('@/hooks/use-search-suggestions')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.mocked(useSearchSuggestions).mockReturnValue({ data: undefined, isFetching: false } as never)
  })

  it('renders a search icon button when closed', () => {
    render(<SearchBar />, { wrapper })
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('expands to show an input when the icon is clicked', async () => {
    render(<SearchBar />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument()
  })

  it('closes and clears query when X button is clicked', async () => {
    render(<SearchBar />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    const input = screen.getByPlaceholderText(/search products/i)
    await userEvent.type(input, 'shirt')
    await userEvent.click(screen.getByRole('button', { name: /close search/i }))
    expect(screen.queryByPlaceholderText(/search products/i)).not.toBeInTheDocument()
  })

  it('closes when Escape is pressed', async () => {
    render(<SearchBar />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/search products/i)).not.toBeInTheDocument()
    )
  })

  it('does not show dropdown when query is shorter than 2 chars', async () => {
    vi.mocked(useSearchSuggestions).mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            name: 'T-Shirt',
            slug: 't-shirt',
            basePrice: '29.99',
            category: null,
            images: [],
          },
        ],
      },
      isFetching: false,
    } as never)

    render(<SearchBar />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    await userEvent.type(screen.getByPlaceholderText(/search products/i), 't') // 1 char
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows suggestions dropdown when query is 2+ chars and data exists', async () => {
    vi.mocked(useSearchSuggestions).mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            name: 'Classic T-Shirt',
            slug: 'classic-t-shirt',
            basePrice: '29.99',
            category: { name: 'Clothing', id: 'c1', slug: 'clothing' },
            images: [],
          },
        ],
      },
      isFetching: false,
    } as never)

    render(<SearchBar />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    await userEvent.type(screen.getByPlaceholderText(/search products/i), 'sh')

    await waitFor(() => expect(screen.getByText('Classic T-Shirt')).toBeInTheDocument())
    expect(screen.getByText('Clothing')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  it('shows "no products found" when suggestions are empty', async () => {
    vi.mocked(useSearchSuggestions).mockReturnValue({
      data: { data: [] },
      isFetching: false,
    } as never)

    render(<SearchBar />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    await userEvent.type(screen.getByPlaceholderText(/search products/i), 'zzz')

    await waitFor(() => expect(screen.getByText(/no products found/i)).toBeInTheDocument())
  })

  it('navigates to /products?search=query on form submit', async () => {
    const { useRouter } = await import('next/navigation')
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as never)

    render(<SearchBar />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    await userEvent.type(screen.getByPlaceholderText(/search products/i), 'denim')
    await userEvent.keyboard('{Enter}')

    expect(push).toHaveBeenCalledWith('/products?search=denim')
  })
})
