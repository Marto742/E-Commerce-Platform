import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchHitCard } from '../search-hit-card'
import type { SearchHit } from '@/types/api'

const baseHit: SearchHit = {
  id: 'p1',
  name: 'Blue Widget',
  slug: 'blue-widget',
  description: 'A widget',
  categoryId: 'c1',
  categoryName: 'Gadgets',
  basePrice: 29.99,
  comparePrice: null,
  imageUrl: null,
  inStock: true,
  isFeatured: false,
  minPrice: 29.99,
  maxPrice: 29.99,
  rating: 0,
  reviewCount: 0,
}

describe('SearchHitCard', () => {
  it('renders name, category, and price', () => {
    render(<SearchHitCard hit={baseHit} />)
    expect(screen.getByText('Blue Widget')).toBeInTheDocument()
    expect(screen.getByText('Gadgets')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  it('links to the product detail page', () => {
    render(<SearchHitCard hit={baseHit} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/blue-widget')
  })

  it('shows an out-of-stock badge when not in stock', () => {
    render(<SearchHitCard hit={{ ...baseHit, inStock: false }} />)
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })

  it('shows a struck-through compare price when discounted', () => {
    render(<SearchHitCard hit={{ ...baseHit, basePrice: 20, comparePrice: 30 }} />)
    expect(screen.getByText('$20.00')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
  })

  it('does not show a strikethrough when compare price is not higher than base', () => {
    const { container } = render(
      <SearchHitCard hit={{ ...baseHit, basePrice: 30, comparePrice: 30 }} />
    )
    // base price still renders, but there should be no line-through element
    expect(screen.getByText('$30.00')).toBeInTheDocument()
    expect(container.querySelector('.line-through')).toBeNull()
  })

  it('shows the review count when the product has reviews', () => {
    render(<SearchHitCard hit={{ ...baseHit, rating: 4.5, reviewCount: 12 }} />)
    expect(screen.getByText('(12)')).toBeInTheDocument()
  })

  it('hides the rating when there are no reviews', () => {
    render(<SearchHitCard hit={{ ...baseHit, rating: 0, reviewCount: 0 }} />)
    expect(screen.queryByText('(0)')).toBeNull()
  })
})
