/**
 * Checkout Form Component
 * Single-page checkout with all fields visible at once
 */

'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/stores'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export interface CheckoutFormProps {
  className?: string
}

interface FormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
}

interface FormErrors {
  [key: string]: string | undefined
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function CheckoutForm({ className }: CheckoutFormProps) {
  const router = useRouter()
  const { items, totals, clearCart } = useCartStore()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        return undefined
      case 'firstName':
        if (!value.trim()) return 'First name is required'
        return undefined
      case 'lastName':
        if (!value.trim()) return 'Last name is required'
        return undefined
      case 'addressLine1':
        if (!value.trim()) return 'Street address is required'
        return undefined
      case 'city':
        if (!value.trim()) return 'City is required'
        return undefined
      case 'state':
        if (!value) return 'State is required'
        return undefined
      case 'postalCode':
        if (!value.trim()) return 'ZIP code is required'
        return undefined
      default:
        return undefined
    }
  }

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name] !== undefined) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'WELCOME10') {
      setDiscount(totals.subtotal * 0.1)
      setPromoApplied(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    const requiredFields: (keyof FormData)[] = ['email', 'firstName', 'lastName', 'addressLine1', 'city', 'state', 'postalCode']
    const newErrors: FormErrors = {}
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsProcessing(true)
    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
      const orderData = {
        orderNumber,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          address: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        },
        paymentMethod,
        subtotal: totals.subtotal,
        tax: totals.tax,
        shippingCost: totals.shipping,
        discount,
        total: totals.total - discount,
        items: items.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.totalPrice,
        })),
        orderDate: new Date().toISOString(),
      }
      sessionStorage.setItem('lastOrder', JSON.stringify(orderData))
      clearCart()
      router.push('/order-confirmation')
    } catch {
      // ignore
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-cream-600"  />
        <h2 className="text-xl font-display mb-2 text-cream-200" >Your cart is empty</h2>
        <p className="text-sm mb-6 text-cream-600" >Add some products before checking out.</p>
        <Button asChild><a href="/products">Browse Products</a></Button>
      </div>
    )
  }

  const finalTotal = totals.total - discount

  const inputClass = "atelier-input"
  const labelClass = "block text-xs tracking-[0.1em] uppercase font-mono mb-2 text-cream-500"
  const sectionHeadingClass = "text-xs tracking-[0.2em] uppercase font-mono mb-6"

  return (
    <div className={`max-w-6xl mx-auto px-6 py-10 ${className ?? ''}`}>
      <h1
        className="font-display text-3xl lg:text-4xl font-light mb-10 text-cream-100"

      >
        Checkout
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Form fields */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <div className="atelier-card p-6 lg:p-8">
              <h2 className={sectionHeadingClass} >Contact Information</h2>
              <div className="space-y-4 text-cream-400">
                <div>
                  <label htmlFor="customer-email" className={labelClass}>
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    id="customer-email"
                    type="email"
                    data-testid="customer-email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p data-testid="error-customer-email" className="text-xs mt-1 text-error"  role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer-first-name" className={labelClass}>
                      First Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="customer-first-name"
                      type="text"
                      data-testid="customer-first-name"
                      value={formData.firstName}
                      onChange={e => handleChange('firstName', e.target.value)}
                      placeholder="John"
                      className={inputClass}
                      autoComplete="given-name"
                    />
                    {errors.firstName && (
                      <p data-testid="error-customer-first-name" className="text-xs mt-1 text-error"  role="alert">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="customer-last-name" className={labelClass}>
                      Last Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="customer-last-name"
                      type="text"
                      data-testid="customer-last-name"
                      value={formData.lastName}
                      onChange={e => handleChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className={inputClass}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-phone" className={labelClass}>
                    Phone
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    data-testid="customer-phone"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    placeholder="555-123-4567"
                    className={inputClass}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="atelier-card p-6 lg:p-8">
              <h2 className={sectionHeadingClass} >Shipping Address</h2>
              <div className="space-y-4 text-cream-400">
                <div>
                  <label htmlFor="shipping-address-line-1" className={labelClass}>
                    Street Address <span className="text-error">*</span>
                  </label>
                  <input
                    id="shipping-address-line-1"
                    type="text"
                    data-testid="shipping-address-line-1"
                    value={formData.addressLine1}
                    onChange={e => handleChange('addressLine1', e.target.value)}
                    placeholder="123 Main St"
                    className={inputClass}
                    autoComplete="street-address"
                  />
                  {errors.addressLine1 && (
                    <p data-testid="error-shipping-address" className="text-xs mt-1 text-error"  role="alert">
                      {errors.addressLine1}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="shipping-city" className={labelClass}>
                      City <span className="text-error">*</span>
                    </label>
                    <input
                      id="shipping-city"
                      type="text"
                      data-testid="shipping-city"
                      value={formData.city}
                      onChange={e => handleChange('city', e.target.value)}
                      placeholder="Charlotte"
                      className={inputClass}
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label htmlFor="shipping-state" className={labelClass}>
                      State <span className="text-error">*</span>
                    </label>
                    <select
                      id="shipping-state"
                      data-testid="shipping-state"
                      value={formData.state}
                      onChange={e => handleChange('state', e.target.value)}
                      className={inputClass}
                      autoComplete="address-level1"
                    >
                      <option value="">State</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="shipping-postal-code" className={labelClass}>
                      ZIP <span className="text-error">*</span>
                    </label>
                    <input
                      id="shipping-postal-code"
                      type="text"
                      data-testid="shipping-postal-code"
                      value={formData.postalCode}
                      onChange={e => handleChange('postalCode', e.target.value)}
                      placeholder="28202"
                      className={inputClass}
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="atelier-card p-6 lg:p-8">
              <h2 className={sectionHeadingClass} >Payment Method</h2>
              <div className="space-y-3 text-cream-400">
                <label
                  className="flex items-center gap-3 p-4 cursor-pointer transition-all duration-200"
                  style={{
                    border: paymentMethod === 'cod'
                      ? '1px solid var(--gold-400)'
                      : '1px solid rgba(216,204,175,0.1)',
                    background: paymentMethod === 'cod'
                      ? 'rgba(216,204,175,0.03)'
                      : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value="cod"
                    data-testid="payment-method-cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="text-sm font-medium text-cream-200" >Cash on Delivery</div>
                    <div className="text-xs text-cream-600" >Pay with cash when your order arrives</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Promo Code */}
            <div className="atelier-card p-6 lg:p-8" data-testid="promo-code-section">
              <h2 className={sectionHeadingClass} >Promo Code</h2>
              <div className="flex gap-2 text-cream-400">
                <input
                  type="text"
                  data-testid="promo-code-input"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className={`${inputClass} flex-1`}
                />
                <Button type="button" data-testid="apply-promo-btn" onClick={applyPromo} variant="outline">
                  Apply
                </Button>
              </div>
              {promoApplied && discount > 0 && (
                <p data-testid="discount-amount" className="text-xs font-mono mt-2 text-primary-400" >
                  Discount: -{formatCurrency(discount)}
                </p>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="atelier-card p-6 lg:p-8 sticky top-6">
              <h2 className={sectionHeadingClass} >Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 text-cream-400">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span >{item.product.name} × {item.quantity}</span>
                    <span className="font-mono text-cream-200 text-cream-300" >{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <hr className="atelier-divider mb-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span >Subtotal</span>
                  <span  data-testid="order-subtotal">{formatCurrency(totals.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-cream-500 text-cream-300">
                    <span >Discount</span>
                    <span >-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-primary-400 text-primary-400">
                  <span >Tax</span>
                  <span  data-testid="order-tax">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-cream-500 text-cream-300">
                  <span className="text-cream-500">Shipping</span>
                  <span style={{ color: totals.shipping === 0 ? 'var(--sage-400)' : 'var(--cream-300)' }}>
                    {totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping)}
                  </span>
                </div>
                <hr className="atelier-divider !my-3" />
                <div className="flex justify-between text-base">
                  <span className="text-cream-200">Total</span>
                  <span  data-testid="order-total">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-6 h-12 text-cream-100"
                data-testid="place-order-btn"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Place Order — ${formatCurrency(finalTotal)}`}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}