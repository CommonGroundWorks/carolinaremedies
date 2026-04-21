import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../../../utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')

    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-input', 'bg-background')

    rerender(<Button variant="secondary">Secondary</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')

    rerender(<Button variant="link">Link</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-primary', 'underline-offset-4')

    rerender(<Button variant="success">Success</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-green-600', 'text-white')

    rerender(<Button variant="warning">Warning</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-yellow-500', 'text-white')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-8', 'px-3', 'text-xs')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'px-8')

    rerender(<Button size="xl">Extra Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-12', 'px-10', 'text-base')

    rerender(<Button size="icon">Icon</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'w-9')
  })

  it('handles loading state correctly', () => {
    render(<Button loading>Loading</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    // Check for loading spinner
    const spinner = screen.getByRole('img', { hidden: true })
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick} disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not trigger click when loading', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick} loading>Loading</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
    // Should still have default classes
    expect(button).toHaveClass('inline-flex', 'items-center')
  })

  it('forwards additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Test</Button>)
    
    const button = screen.getByTestId('custom-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Custom button')
  })

  it('supports ref forwarding', () => {
    const ref = vi.fn()
    
    render(<Button ref={ref}>Ref test</Button>)
    
    expect(ref).toHaveBeenCalled()
  })

  describe('Accessibility', () => {
    it('has correct ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('disabled')
    })

    it('maintains focus styles', () => {
      render(<Button>Focus me</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Press Enter</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('Visual consistency', () => {
    it('maintains consistent spacing with icons', () => {
      render(
        <Button>
          <span>Icon</span>
          Text with icon
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('gap-2')
    })

    it('handles text wrapping correctly', () => {
      render(<Button>This is a very long button text that might wrap</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('whitespace-nowrap')
    })
  })
})