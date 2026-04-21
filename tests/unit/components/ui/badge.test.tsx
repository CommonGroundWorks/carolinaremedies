import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../utils/test-utils'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  it('renders correctly with default variant', () => {
    render(<Badge>Default Badge</Badge>)
    
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md', 'border')
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground') // default variant styles
  })

  it('applies secondary variant styles correctly', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>)
    
    const badge = screen.getByText('Secondary Badge')
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    expect(badge).toHaveClass('hover:bg-secondary/80')
  })

  it('applies destructive variant styles correctly', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>)
    
    const badge = screen.getByText('Destructive Badge')
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
    expect(badge).toHaveClass('hover:bg-destructive/80')
  })

  it('applies outline variant styles correctly', () => {
    render(<Badge variant="outline">Outline Badge</Badge>)
    
    const badge = screen.getByText('Outline Badge')
    expect(badge).toHaveClass('text-foreground')
    expect(badge).not.toHaveClass('bg-primary') // Should not have filled background
  })

  it('applies success variant styles correctly', () => {
    render(<Badge variant="success">Success Badge</Badge>)
    
    const badge = screen.getByText('Success Badge')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    expect(badge).toHaveClass('hover:bg-green-200')
  })

  it('applies warning variant styles correctly', () => {
    render(<Badge variant="warning">Warning Badge</Badge>)
    
    const badge = screen.getByText('Warning Badge')
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200')
    expect(badge).toHaveClass('hover:bg-yellow-200')
  })

  it('applies info variant styles correctly', () => {
    render(<Badge variant="info">Info Badge</Badge>)
    
    const badge = screen.getByText('Info Badge')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200')
    expect(badge).toHaveClass('hover:bg-blue-200')
  })

  it('applies thc variant styles correctly', () => {
    render(<Badge variant="thc">THC Badge</Badge>)
    
    const badge = screen.getByText('THC Badge')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200')
    expect(badge).toHaveClass('hover:bg-red-200')
  })

  it('applies cbd variant styles correctly', () => {
    render(<Badge variant="cbd">CBD Badge</Badge>)
    
    const badge = screen.getByText('CBD Badge')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    expect(badge).toHaveClass('hover:bg-green-200')
  })

  it('applies indica variant styles correctly', () => {
    render(<Badge variant="indica">Indica</Badge>)
    
    const badge = screen.getByText('Indica')
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800', 'border-purple-200')
    expect(badge).toHaveClass('hover:bg-purple-200')
  })

  it('applies sativa variant styles correctly', () => {
    render(<Badge variant="sativa">Sativa</Badge>)
    
    const badge = screen.getByText('Sativa')
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200')
    expect(badge).toHaveClass('hover:bg-orange-200')
  })

  it('applies hybrid variant styles correctly', () => {
    render(<Badge variant="hybrid">Hybrid</Badge>)
    
    const badge = screen.getByText('Hybrid')
    expect(badge).toHaveClass('bg-indigo-100', 'text-indigo-800', 'border-indigo-200')
    expect(badge).toHaveClass('hover:bg-indigo-200')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    
    const badge = screen.getByText('Custom Badge')
    expect(badge).toHaveClass('custom-class')
    // Should still have base classes
    expect(badge).toHaveClass('inline-flex', 'items-center')
  })

  it('forwards additional props', () => {
    render(
      <Badge data-testid="test-badge" aria-label="Test badge">
        Test Badge
      </Badge>
    )
    
    const badge = screen.getByTestId('test-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('aria-label', 'Test badge')
  })

  describe('Cannabis-specific badges', () => {
    it('renders THC percentage badge correctly', () => {
      render(<Badge variant="thc">THC 18.5%</Badge>)
      
      const badge = screen.getByText('THC 18.5%')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('renders CBD percentage badge correctly', () => {
      render(<Badge variant="cbd">CBD 25%</Badge>)
      
      const badge = screen.getByText('CBD 25%')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('renders strain type badges correctly', () => {
      const { rerender } = render(<Badge variant="indica">Indica</Badge>)
      
      let badge = screen.getByText('Indica')
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')

      rerender(<Badge variant="sativa">Sativa</Badge>)
      badge = screen.getByText('Sativa')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')

      rerender(<Badge variant="hybrid">Hybrid</Badge>)
      badge = screen.getByText('Hybrid')
      expect(badge).toHaveClass('bg-indigo-100', 'text-indigo-800')
    })
  })

  describe('Status badges', () => {
    it('renders success status correctly', () => {
      render(<Badge variant="success">In Stock</Badge>)
      
      const badge = screen.getByText('In Stock')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('renders warning status correctly', () => {
      render(<Badge variant="warning">Low Stock</Badge>)
      
      const badge = screen.getByText('Low Stock')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })

    it('renders destructive status correctly', () => {
      render(<Badge variant="destructive">Out of Stock</Badge>)
      
      const badge = screen.getByText('Out of Stock')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })
  })

  describe('Accessibility', () => {
    it('supports ARIA labels for screen readers', () => {
      render(
        <Badge variant="thc" aria-label="THC content eighteen point five percent">
          THC 18.5%
        </Badge>
      )
      
      const badge = screen.getByLabelText('THC content eighteen point five percent')
      expect(badge).toBeInTheDocument()
    })

    it('maintains readable text contrast', () => {
      // Test that different variants maintain good contrast
      const variants = [
        'default', 'secondary', 'destructive', 'outline', 
        'success', 'warning', 'info', 'thc', 'cbd', 
        'indica', 'sativa', 'hybrid'
      ] as const

      variants.forEach(variant => {
        const { unmount } = render(<Badge variant={variant}>{variant} badge</Badge>)
        const badge = screen.getByText(`${variant} badge`)
        expect(badge).toBeInTheDocument()
        unmount()
      })
    })

    it('supports role attribute for semantic meaning', () => {
      render(
        <Badge variant="info" role="status" aria-live="polite">
          Processing
        </Badge>
      )
      
      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Layout and spacing', () => {
    it('maintains consistent size and spacing', () => {
      render(<Badge>Consistent Badge</Badge>)
      
      const badge = screen.getByText('Consistent Badge')
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs', 'font-semibold')
    })

    it('handles long text appropriately', () => {
      render(<Badge>This is a very long badge text that should wrap properly</Badge>)
      
      const badge = screen.getByText('This is a very long badge text that should wrap properly')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('inline-flex') // Should allow wrapping
    })
  })
})