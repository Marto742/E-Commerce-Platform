import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorDisplay } from '../error-display'

describe('ErrorDisplay', () => {
  it('renders default title and message', () => {
    render(<ErrorDisplay />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
  })

  it('renders custom title and message', () => {
    render(<ErrorDisplay title="Could not load" message="Network error." />)
    expect(screen.getByText('Could not load')).toBeInTheDocument()
    expect(screen.getByText('Network error.')).toBeInTheDocument()
  })

  it('renders a Try again button when onRetry is provided', () => {
    render(<ErrorDisplay onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('does not render a Try again button without onRetry', () => {
    render(<ErrorDisplay />)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('calls onRetry when the button is clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorDisplay onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders a Go home link by default', () => {
    render(<ErrorDisplay />)
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/')
  })

  it('does not render Go home link when showHomeLink=false', () => {
    render(<ErrorDisplay showHomeLink={false} />)
    expect(screen.queryByRole('link', { name: /go home/i })).not.toBeInTheDocument()
  })
})
