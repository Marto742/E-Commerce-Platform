import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '../pagination'
import type { PaginationMeta } from '@/types/api'

function meta(over: Partial<PaginationMeta> = {}): PaginationMeta {
  return {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNextPage: true,
    hasPrevPage: false,
    ...over,
  }
}

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = render(
      <Pagination meta={meta({ totalPages: 1, hasNextPage: false })} onPageChange={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a navigation landmark with page buttons', () => {
    render(<Pagination meta={meta()} onPageChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
  })

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination meta={meta()} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()

    rerender(
      <Pagination
        meta={meta({ page: 10, hasNextPage: false, hasPrevPage: true })}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onPageChange with the clicked page', async () => {
    const onPageChange = vi.fn()
    render(<Pagination meta={meta()} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: '3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('renders an ellipsis for long ranges', () => {
    render(<Pagination meta={meta({ page: 5 })} onPageChange={vi.fn()} />)
    // page 5 of 10 -> [1, '...', 4, 5, 6, '...', 10]
    expect(screen.queryByRole('button', { name: '8' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-current', 'page')
  })
})
