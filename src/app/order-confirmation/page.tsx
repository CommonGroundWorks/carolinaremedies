'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderData {
  orderNumber: string
  orderDate: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  shippingAddress: {
    address: string
    city: string
    state: string
    postalCode: string
  }
  paymentMethod: string
  subtotal: number
  tax: number
  shippingCost: number
  discount: number
  total: number
  items: OrderItem[]
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastOrder')
      if (raw) {
        setOrder(JSON.parse(raw))
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-cream-600" >Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="font-display text-2xl mb-4 text-cream-200" >No order found</h1>
        <p className="text-sm mb-6 text-cream-600" >We could not find your order details.</p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  const orderDate = order.orderDate
    ? new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const estimatedDelivery = (() => {
    const d = order.orderDate ? new Date(order.orderDate) : new Date()
    d.setDate(d.getDate() + 5)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  })()

  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod

  const sectionHeading = "text-xs tracking-[0.2em] uppercase font-mono mb-5"

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div
          className="h-14 w-14 mx-auto mb-5 flex items-center justify-center border border-primary-500/30 bg-primary-500/[0.08]"
        >
          <CheckCircle className="h-6 w-6 text-primary-400"  aria-hidden="true" />
        </div>
        <h1
          data-testid="order-confirmation-title"
          className="font-display text-3xl lg:text-4xl font-light mb-3 text-cream-100"

        >
          Order Confirmed
        </h1>
        <p className="text-sm text-cream-500" >
          Thank you for your order. We have received your request.
        </p>
      </div>

      {/* Order Details */}
      <div data-testid="order-details" className="space-y-6">
        {/* Order Number & Date */}
        <div className="atelier-card p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-xs font-mono tracking-wide uppercase mb-1 text-cream-600" >Order Number</p>
              <p data-testid="order-number" className="font-mono text-base text-secondary-400" >
                {order.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono tracking-wide uppercase mb-1 text-cream-600" >Order Date</p>
              <p data-testid="order-date" >
                {orderDate}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono tracking-wide uppercase mb-1 text-cream-600 text-cream-300" >Estimated Delivery</p>
              <p data-testid="estimated-delivery" >
                {estimatedDelivery}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="atelier-card p-6 text-cream-300">
          <h2 className={sectionHeading} >Customer Information</h2>
          <div data-testid="order-customer-info" className="text-sm space-y-1 text-cream-400">
            <p className="text-cream-200">{order.customer.firstName} {order.customer.lastName}</p>
            <p >{order.customer.email}</p>
            {order.customer.phone && <p >{order.customer.phone}</p>}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="atelier-card p-6 text-cream-500">
          <h2 className={sectionHeading} >Shipping Address</h2>
          <div data-testid="order-shipping-address" className="text-sm space-y-1 text-cream-400">
            <p className="text-cream-200">{order.shippingAddress.address}</p>
            <p >{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
          </div>
          <div data-testid="shipping-address-summary" className="text-xs mt-3 text-cream-600 text-cream-200" >
            Shipping to: {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </div>
        </div>

        {/* Payment Method */}
        <div className="atelier-card p-6">
          <h2 className={sectionHeading} >Payment Method</h2>
          <p data-testid="order-payment-method" className="text-sm text-cream-200 text-cream-400" >
            {paymentLabel}
          </p>
          <p data-testid="payment-method-summary" className="text-xs mt-1 text-cream-600" >
            Payment: {paymentLabel}
          </p>
        </div>

        {/* Order Items */}
        <div className="atelier-card p-6">
          <h2 className={sectionHeading} >Order Items</h2>
          <div data-testid="order-items-summary" className="space-y-3 text-cream-400">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span >{item.name} &times; {item.quantity}</span>
                <span className="font-mono text-cream-200 text-cream-300" >{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div className="atelier-card p-6">
          <h2 className={sectionHeading} >Order Total</h2>
          <div data-testid="order-total-summary" className="space-y-2 text-sm font-mono text-cream-400">
            <div className="flex justify-between">
              <span >Subtotal</span>
              <span >{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-cream-500 text-cream-300">
                <span >Discount</span>
                <span >-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-primary-400 text-primary-400">
              <span >Tax</span>
              <span >{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-cream-500 text-cream-300">
              <span className="text-cream-500">Shipping</span>
              <span style={{ color: order.shippingCost === 0 ? 'var(--sage-400)' : 'var(--cream-300)' }}>
                {order.shippingCost === 0 ? 'FREE' : formatCurrency(order.shippingCost)}
              </span>
            </div>
            <hr className="atelier-divider !my-3" />
            <div className="flex justify-between text-base">
              <span >Total</span>
              <span >{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Tracking Info */}
        <div className="atelier-card p-6 text-cream-200 text-cream-100">
          <h2 className={sectionHeading} >Order Tracking</h2>
          <div data-testid="order-tracking-info" className="text-sm space-y-1 text-cream-400">
            <p className="text-cream-500">Your order has been confirmed and is being processed.</p>
            <p >Tracking information will be sent to {order.customer.email} once your order ships.</p>
          </div>
        </div>

        {/* Customer Service */}
        <div className="atelier-card p-6 text-cream-500">
          <h2 className={sectionHeading} >Need Help?</h2>
          <div data-testid="customer-service-contact" className="text-sm text-cream-400">
            <p >Contact our customer service team for any questions about your order.</p>
            <p className="mt-2 text-cream-500">
              <a href="mailto:support@carolinaremedies.com" className="text-sm transition-colors text-secondary-400" >
                support@carolinaremedies.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-10 flex gap-4 justify-center">
        <Button asChild variant="outline" data-testid="continue-shopping-btn">
          <Link href="/products">Continue Shopping</Link>
        </Button>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}
