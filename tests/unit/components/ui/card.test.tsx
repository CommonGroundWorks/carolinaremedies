import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../utils/test-utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders correctly with default styles', () => {
      render(
        <Card data-testid="card">
          <div>Card content</div>
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'text-card-foreground', 'shadow')
    })

    it('applies custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
      expect(card).toHaveClass('rounded-xl') // Should still have default classes
    })

    it('forwards additional props', () => {
      render(
        <Card data-testid="card" aria-label="Custom card">
          Content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('aria-label', 'Custom card')
    })
  })

  describe('CardHeader', () => {
    it('renders with correct spacing', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const header = screen.getByTestId('card-header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header" data-testid="card-header">
            Content
          </CardHeader>
        </Card>
      )
      
      const header = screen.getByTestId('card-header')
      expect(header).toHaveClass('custom-header')
      expect(header).toHaveClass('flex', 'flex-col')
    })
  })

  describe('CardTitle', () => {
    it('renders with correct typography styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title">Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByTestId('card-title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight')
      expect(title).toHaveTextContent('Card Title')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title" data-testid="card-title">
              Title
            </CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByTestId('card-title')
      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('font-semibold')
    })
  })

  describe('CardDescription', () => {
    it('renders with muted text styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="card-description">
              This is a description
            </CardDescription>
          </CardHeader>
        </Card>
      )
      
      const description = screen.getByTestId('card-description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
      expect(description).toHaveTextContent('This is a description')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-description" data-testid="card-description">
              Description
            </CardDescription>
          </CardHeader>
        </Card>
      )
      
      const description = screen.getByTestId('card-description')
      expect(description).toHaveClass('custom-description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    it('renders with correct padding', () => {
      render(
        <Card>
          <CardContent data-testid="card-content">
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      )
      
      const content = screen.getByTestId('card-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-6', 'pt-0')
      expect(content).toHaveTextContent('Card content goes here')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content" data-testid="card-content">
            Content
          </CardContent>
        </Card>
      )
      
      const content = screen.getByTestId('card-content')
      expect(content).toHaveClass('custom-content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })
  })

  describe('CardFooter', () => {
    it('renders with flex layout', () => {
      render(
        <Card>
          <CardFooter data-testid="card-footer">
            <button>Action</button>
          </CardFooter>
        </Card>
      )
      
      const footer = screen.getByTestId('card-footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer" data-testid="card-footer">
            Footer
          </CardFooter>
        </Card>
      )
      
      const footer = screen.getByTestId('card-footer')
      expect(footer).toHaveClass('custom-footer')
      expect(footer).toHaveClass('flex', 'items-center')
    })
  })

  describe('Card Composition', () => {
    it('renders complete card structure correctly', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Product Card</CardTitle>
            <CardDescription>A premium cannabis product</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Product details and information</p>
          </CardContent>
          <CardFooter>
            <button>Add to Cart</button>
          </CardFooter>
        </Card>
      )
      
      const card = screen.getByTestId('complete-card')
      expect(card).toBeInTheDocument()
      
      const title = screen.getByText('Product Card')
      expect(title).toBeInTheDocument()
      
      const description = screen.getByText('A premium cannabis product')
      expect(description).toBeInTheDocument()
      
      const content = screen.getByText('Product details and information')
      expect(content).toBeInTheDocument()
      
      const button = screen.getByRole('button', { name: 'Add to Cart' })
      expect(button).toBeInTheDocument()
    })

    it('works without optional components', () => {
      render(
        <Card data-testid="minimal-card">
          <CardContent>
            <p>Just content, no header or footer</p>
          </CardContent>
        </Card>
      )
      
      const card = screen.getByTestId('minimal-card')
      expect(card).toBeInTheDocument()
      
      const content = screen.getByText('Just content, no header or footer')
      expect(content).toBeInTheDocument()
    })

    it('maintains proper spacing between components', () => {
      render(
        <Card>
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      )
      
      const header = screen.getByTestId('header')
      const content = screen.getByTestId('content')
      const footer = screen.getByTestId('footer')
      
      // Header should have full padding
      expect(header).toHaveClass('p-6')
      
      // Content and footer should have top padding removed to avoid double spacing
      expect(content).toHaveClass('pt-0')
      expect(footer).toHaveClass('pt-0')
    })
  })

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      render(
        <Card 
          data-testid="accessible-card"
          role="article"
          aria-labelledby="card-title"
        >
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
          </CardHeader>
          <CardContent>
            Content with proper labeling
          </CardContent>
        </Card>
      )
      
      const card = screen.getByTestId('accessible-card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-labelledby', 'card-title')
      
      const title = screen.getByText('Accessible Card')
      expect(title).toHaveAttribute('id', 'card-title')
    })
  })
})