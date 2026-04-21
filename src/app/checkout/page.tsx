/**
 * Checkout Page
 * Main checkout flow with COD payment processing
 */

import Link from 'next/link'
import { CheckoutForm } from '@/components/checkout'
import { getSiteSettings } from '@/lib/site-settings.server'

export default async function CheckoutPage() {
  const siteSettings = await getSiteSettings()

  if (!siteSettings.shopping_enabled) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-xs tracking-[0.18em] uppercase font-mono text-secondary-400">
          Catalog Mode
        </p>
        <h1 className="mt-4 font-display text-4xl text-cream-100">
          Checkout is currently disabled
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-cream-500">
          The storefront is running as a simple catalog right now. Browse products
          and manage inventory from admin until shopping is turned back on.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-11 items-center justify-center px-6 text-xs uppercase tracking-[0.18em] bg-primary-600 text-cream-100 transition-colors hover:bg-primary-700"
        >
          Browse Catalog
        </Link>
      </div>
    )
  }

  return <CheckoutForm />
}

export const metadata = {
  title: 'Checkout | NCRemedies',
  description: 'Complete your order with secure checkout and cash on delivery options'
}