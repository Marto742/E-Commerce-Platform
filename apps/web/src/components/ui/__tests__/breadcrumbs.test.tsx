import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '../breadcrumbs'

describe('Breadcrumbs', () => {
  it('always prepends a Home link', () => {
    render(<Breadcrumbs items={[{ label: 'Products', href: '/products' }]} />)
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
  })

  it('renders all provided items', () => {
    render(<Breadcrumbs items={[{ label: 'Products', href: '/products' }, { label: 'T-Shirt' }]} />)
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument()
    expect(screen.getByText('T-Shirt')).toBeInTheDocument()
  })

  it('renders the last item as non-link with aria-current="page"', () => {
    render(
      <Breadcrumbs items={[{ label: 'Products', href: '/products' }, { label: 'My Product' }]} />
    )
    const current = screen.getByText('My Product')
    expect(current.tagName).toBe('SPAN')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('renders intermediate items as links', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Products', href: '/products' },
          { label: 'Shoes', href: '/products?categoryId=abc' },
          { label: 'Nike Air Max' },
        ]}
      />
    )
    expect(screen.getByRole('link', { name: /products/i })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: /shoes/i })).toHaveAttribute(
      'href',
      '/products?categoryId=abc'
    )
    expect(screen.getByText('Nike Air Max')).not.toHaveAttribute('href')
  })

  it('renders a nav landmark with breadcrumb label', () => {
    render(<Breadcrumbs items={[{ label: 'Products' }]} />)
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
  })

  it('injects a JSON-LD script tag', () => {
    const { container } = render(<Breadcrumbs items={[{ label: 'Products', href: '/products' }]} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    const data = JSON.parse(script!.textContent ?? '{}')
    expect(data['@type']).toBe('BreadcrumbList')
    expect(data.itemListElement).toHaveLength(2) // Home + Products
  })

  it('handles a single item (just current page)', () => {
    render(<Breadcrumbs items={[{ label: 'Home Page' }]} />)
    // Home link + "Home Page" as current
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByText('Home Page')).toHaveAttribute('aria-current', 'page')
  })
})
