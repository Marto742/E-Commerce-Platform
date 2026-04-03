import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuantityPicker } from '../quantity-picker'

function setup(props: Partial<React.ComponentProps<typeof QuantityPicker>> = {}) {
  const onChange = vi.fn()
  const utils = render(<QuantityPicker value={1} onChange={onChange} {...props} />)
  return {
    ...utils,
    onChange,
    decrement: () => screen.getByRole('button', { name: /decrease quantity/i }),
    increment: () => screen.getByRole('button', { name: /increase quantity/i }),
    input: () => screen.getByRole('textbox', { name: /quantity/i }),
  }
}

describe('QuantityPicker', () => {
  describe('rendering', () => {
    it('displays the current value', () => {
      setup({ value: 3 })
      expect(screen.getByRole('textbox', { name: /quantity/i })).toHaveValue('3')
    })

    it('disables decrement at min', () => {
      const { decrement } = setup({ value: 1, min: 1 })
      expect(decrement()).toBeDisabled()
    })

    it('disables increment at max', () => {
      const { increment } = setup({ value: 5, max: 5 })
      expect(increment()).toBeDisabled()
    })

    it('renders both buttons and an input', () => {
      setup()
      expect(screen.getByRole('button', { name: /decrease/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /increase/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /quantity/i })).toBeInTheDocument()
    })
  })

  describe('increment / decrement buttons', () => {
    it('calls onChange with value + 1 when increment clicked', async () => {
      const { onChange, increment } = setup({ value: 2 })
      await userEvent.click(increment())
      expect(onChange).toHaveBeenCalledWith(3)
    })

    it('calls onChange with value - 1 when decrement clicked', async () => {
      const { onChange, decrement } = setup({ value: 3, min: 1 })
      await userEvent.click(decrement())
      expect(onChange).toHaveBeenCalledWith(2)
    })

    it('clamps decrement at min', async () => {
      const { onChange, decrement } = setup({ value: 2, min: 2 })
      // button should be disabled at min=2, value=2
      expect(decrement()).toBeDisabled()
      expect(onChange).not.toHaveBeenCalled()
    })

    it('clamps increment at max', async () => {
      const { onChange, increment } = setup({ value: 5, max: 5 })
      expect(increment()).toBeDisabled()
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('direct text input', () => {
    it('calls onChange with parsed value on blur', async () => {
      const { onChange, input } = setup({ value: 1 })
      await userEvent.clear(input())
      await userEvent.type(input(), '4')
      await userEvent.tab() // triggers blur
      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('resets display to current value on invalid input blur', async () => {
      const { input } = setup({ value: 2 })
      await userEvent.clear(input())
      await userEvent.type(input(), 'abc')
      await userEvent.tab()
      expect(input()).toHaveValue('2')
    })

    it('clamps value to max on blur', async () => {
      const { onChange, input } = setup({ value: 1, max: 5 })
      await userEvent.clear(input())
      await userEvent.type(input(), '99')
      await userEvent.tab()
      expect(onChange).toHaveBeenCalledWith(5)
    })

    it('clamps value to min on blur', async () => {
      const { onChange, input } = setup({ value: 3, min: 2 })
      await userEvent.clear(input())
      await userEvent.type(input(), '0')
      await userEvent.tab()
      expect(onChange).toHaveBeenCalledWith(2)
    })
  })

  describe('keyboard navigation', () => {
    it('ArrowUp increments', async () => {
      const { onChange, input } = setup({ value: 2, max: 10 })
      input().focus()
      await userEvent.keyboard('{ArrowUp}')
      expect(onChange).toHaveBeenCalledWith(3)
    })

    it('ArrowDown decrements', async () => {
      const { onChange, input } = setup({ value: 4, min: 1 })
      input().focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(onChange).toHaveBeenCalledWith(3)
    })
  })

  describe('disabled state', () => {
    it('renders with reduced interactivity when disabled', () => {
      const { input, decrement, increment } = setup({ value: 2, disabled: true })
      // The wrapper has pointer-events-none; the input itself is disabled
      expect(input()).toBeDisabled()
    })
  })

  describe('external value sync', () => {
    it('updates display when value prop changes', async () => {
      const { rerender, input } = setup({ value: 1 })
      expect(input()).toHaveValue('1')
      rerender(<QuantityPicker value={7} onChange={vi.fn()} />)
      expect(input()).toHaveValue('7')
    })
  })
})
