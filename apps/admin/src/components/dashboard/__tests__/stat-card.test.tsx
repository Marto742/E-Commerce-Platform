import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../stat-card'

describe('StatCard', () => {
  it('renders label, value, and sub text', () => {
    render(<StatCard label="Revenue" value="$1,200" sub="this month" />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$1,200')).toBeInTheDocument()
    expect(screen.getByText('this month')).toBeInTheDocument()
  })

  it('shows a positive change badge with an up arrow', () => {
    render(<StatCard label="Orders" value="42" sub="this month" change={12} />)
    expect(screen.getByText('↑ 12%')).toBeInTheDocument()
  })

  it('shows a negative change badge with a down arrow (absolute value)', () => {
    render(<StatCard label="Orders" value="42" sub="this month" change={-8} />)
    expect(screen.getByText('↓ 8%')).toBeInTheDocument()
  })

  it('omits the change badge when change is null', () => {
    render(<StatCard label="Orders" value="42" sub="this month" change={null} />)
    expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument()
  })
})
