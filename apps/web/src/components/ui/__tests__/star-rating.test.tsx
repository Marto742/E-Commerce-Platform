import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StarRating } from '../star-rating'

describe('StarRating', () => {
  it('renders 5 stars by default', () => {
    const { container } = render(<StarRating rating={3} />)
    // Each star is a <span> wrapping the Star icon — there are `max` outer spans
    const stars = container.querySelectorAll('span.relative')
    expect(stars).toHaveLength(5)
  })

  it('renders custom max number of stars', () => {
    const { container } = render(<StarRating rating={2} max={3} />)
    expect(container.querySelectorAll('span.relative')).toHaveLength(3)
  })

  it('shows numeric value when showValue=true and rating is not null', () => {
    render(<StarRating rating={4.3} showValue />)
    expect(screen.getByText('4.3')).toBeInTheDocument()
  })

  it('does not show numeric value when showValue=false', () => {
    render(<StarRating rating={4.3} showValue={false} />)
    expect(screen.queryByText('4.3')).not.toBeInTheDocument()
  })

  it('does not show numeric value when rating is null', () => {
    render(<StarRating rating={null} showValue />)
    expect(screen.queryByText(/\d\.\d/)).not.toBeInTheDocument()
  })

  it('renders without crashing when rating is null', () => {
    const { container } = render(<StarRating rating={null} />)
    expect(container.querySelectorAll('span.relative')).toHaveLength(5)
  })
})
