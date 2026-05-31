import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HighlightedText } from '../highlighted-text'

describe('HighlightedText', () => {
  it('renders plain text unchanged when there are no markers', () => {
    const { container } = render(<HighlightedText text="Blue Widget" />)
    expect(screen.getByText('Blue Widget')).toBeInTheDocument()
    expect(container.querySelector('mark')).toBeNull()
  })

  it('wraps a marked segment in a <mark> element', () => {
    render(<HighlightedText text="iPhone 15 [[hl]]Pro[[/hl]]" />)
    const mark = screen.getByText('Pro')
    expect(mark.tagName).toBe('MARK')
  })

  it('renders multiple highlighted segments', () => {
    const { container } = render(
      <HighlightedText text="[[hl]]Red[[/hl]] cotton [[hl]]shirt[[/hl]]" />
    )
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
    expect(marks[0]).toHaveTextContent('Red')
    expect(marks[1]).toHaveTextContent('shirt')
  })

  it('does not interpret marker content as HTML (XSS-safe)', () => {
    const { container } = render(
      <HighlightedText text="[[hl]]<img src=x onerror=alert(1)>[[/hl]]" />
    )
    // The angle-bracket content is rendered as text, not a real <img> element
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })
})
