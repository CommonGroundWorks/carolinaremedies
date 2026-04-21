/**
 * Footer Component — Botanical Atelier Edition
 * Warm botanical ink footer with editorial typography.
 *
 * UX/A11y fixes:
 * - currentYear rendered with suppressHydrationWarning (server/client safe)
 * - Duplicate "Our Process" / "Lab Results" links point to distinct anchor fragments
 * - Business hours and brand names wrapped in translate="no"
 */

import * as React from 'react'
import Link from 'next/link'
import { getActiveCategories } from '@/lib/categories'

export interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const categories = getActiveCategories()

  const navLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Our Process', href: '/about#process' },
    { label: 'Lab Results', href: '/about#lab-results' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ]

  return (
    <footer className={className}>
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 bg-earth-900 border-t border-t-cream-300/[0.08]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand column */}
          <div className="md:col-span-4 space-y-6">
            <Link
              href="/"
              className="inline-block transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
              aria-label="Carolina Remedies — Home"
            >
              <span className="font-display font-light text-3xl text-cream-100 -tracking-[0.03em]">
                Carolina<br />Remedies
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs text-cream-500">
              Premium hemp cultivated in the hills of North Carolina.
              Every batch independently tested, Farm Bill compliant.
            </p>

            {/* Contact */}
            <div className="space-y-2">
              <a
                href="mailto:hello@carolinaremedies.com"
                className="block text-sm transition-opacity duration-200 hover:opacity-70 text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                translate="no"
              >
                hello@carolinaremedies.com
              </a>
              <p className="text-xs text-cream-600">
                <span translate="no">Mon – Fri</span> · 9&nbsp;AM – 6&nbsp;PM EST
              </p>
            </div>
          </div>

          {/* Shop column */}
          <div className="md:col-span-3 md:col-start-6">
            <p className="text-xs tracking-widest uppercase mb-6 text-secondary-400 font-sans">
              The Collection
            </p>
            <ul className="space-y-3">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="text-sm transition-opacity duration-200 hover:opacity-70 text-cream-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products"
                  className="text-sm transition-opacity duration-200 hover:opacity-70 text-cream-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Company column */}
          <div className="md:col-span-3 md:col-start-10">
            <p className="text-xs tracking-widest uppercase mb-6 text-secondary-400 font-sans">
              Company
            </p>
            <ul className="space-y-3">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-opacity duration-200 hover:opacity-70 text-cream-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 border-t border-t-cream-300/[0.06]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Legal copy */}
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs leading-relaxed text-cream-600">
              These products have not been evaluated by the FDA and are not intended to diagnose,
              treat, cure, or prevent any disease. For use by adults 21+ only.
              Keep out of reach of children.
            </p>
            <p className="text-xs leading-relaxed text-cream-600">
              All products contain ≤0.3% Δ9-THC per dry weight in compliance with the 2018 Farm Bill.
            </p>
          </div>

          {/* Copyright — suppressHydrationWarning prevents server/client year mismatch */}
          <p
            className="text-xs tabular-nums flex-shrink-0 text-cream-600 font-mono"
            suppressHydrationWarning
          >
            © {new Date().getFullYear()} Carolina Remedies
          </p>
        </div>
      </div>
    </footer>
  )
}
