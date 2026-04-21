/**
 * Age Gate Modal Component
 *
 * UX/A11y fixes:
 * - Uses design system tokens (no hard-coded light-theme gray/red classes)
 * - role="dialog", aria-modal="true", aria-labelledby
 * - Links use focus-visible:ring instead of focus:outline-none
 * - Viewport meta is NOT dynamically injected here (moved to layout.tsx)
 * - Body scroll lock delegated to a single useEffect (no race with cart drawer)
 * - "Reconsider" button relabeled to "Go Back"
 * - Consistent brand styling on both verification and access-denied states
 */

'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

interface AgeGateModalProps {
  isOpen: boolean
  isAccessDenied?: boolean
  onVerify: (isOver21: boolean) => void
  onDeny?: () => void
  onReconsider?: () => void
}

export function AgeGateModal({ isOpen, isAccessDenied = false, onVerify, onDeny, onReconsider }: AgeGateModalProps) {
  const primaryBtnRef = useRef<HTMLButtonElement>(null)

  // Single body-scroll lock (no conflict with cart drawer)
  useEffect(() => {
    const active = isOpen || isAccessDenied
    if (!active) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, isAccessDenied])

  // Move focus into the modal on open
  useEffect(() => {
    if (isOpen || isAccessDenied) {
      primaryBtnRef.current?.focus()
    }
  }, [isOpen, isAccessDenied])

  if (!isOpen && !isAccessDenied) return null

  const handleVerify = (isOver21: boolean) => {
    if (isOver21) {
      onVerify(true)
    } else {
      onDeny?.()
    }
  }

  const handleReconsider = () => {
    onReconsider?.()
  }

  // ── Access Denied ───────────────────────────────────────────────────────────
  if (isAccessDenied) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-earth-950/90 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-denied-title"
        data-testid="access-denied-modal"
      >
        <div className="w-full max-w-md bg-earth-800 border border-cream-300/[0.1] p-8">
          <div className="text-center">
            <ShieldAlert
              className="h-10 w-10 mx-auto mb-6 text-[var(--destructive)]"
              aria-hidden="true"
            />
            <h2
              id="access-denied-title"
              role="heading"
              aria-level={2}
              className="text-2xl font-display font-light text-cream-100 mb-4"
              data-testid="access-denied-title"
            >
              Access Restricted
            </h2>
            <p
              className="text-sm leading-relaxed text-cream-400 mb-6"
              data-testid="access-denied-message"
            >
              You must be 21&nbsp;years of age or older to access this website. This site contains
              information about cannabis products.
            </p>

            <div className="space-y-3 mb-6 text-left" data-testid="alternative-resources">
              <p className="text-xs tracking-widest uppercase text-cream-600 font-sans">
                Alternative Resources
              </p>
              <ul className="text-sm text-cream-500 space-y-1.5">
                <li>· Educational information about hemp and wellness</li>
                <li>· General health and wellness resources</li>
                <li>· Cannabis policy and legislation updates</li>
              </ul>
            </div>

            <Button
              ref={primaryBtnRef}
              onClick={handleReconsider}
              variant="outline"
              className="w-full min-h-[52px] text-base font-medium"
              data-testid="reconsider-age-btn"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Age Verification ────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-earth-950/90 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      data-testid="age-gate-modal"
    >
      <div className="w-full max-w-md bg-earth-800 border border-cream-300/[0.1] p-8">
        <div className="text-center">
          {/* Eyebrow */}
          <span className="inline-block text-xs font-sans tracking-[0.15em] uppercase px-3 py-1 mb-5 border border-secondary-400/30 text-secondary-400">
            Educational Demo
          </span>

          <h2
            id="age-gate-title"
            role="heading"
            aria-level={2}
            className="font-display font-light text-2xl text-cream-100 mb-4"
            data-testid="age-gate-title"
          >
            Age Verification Required
          </h2>

          <div className="mb-8" data-testid="age-gate-message">
            <p className="text-sm leading-relaxed text-cream-400 mb-3">
              This is a simulated verification feature for this open-source template. You must be
              21&nbsp;years of age or older to view this website.
            </p>
            <p className="text-xs text-cream-600">
              By entering this site, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <Button
              ref={primaryBtnRef}
              type="button"
              onClick={() => handleVerify(true)}
              className="w-full min-h-[52px] text-base font-medium"
              data-testid="age-verify-yes"
              aria-label="I am 21 years of age or older — enter site"
            >
              I am 21 or older
            </Button>
            <Button
              type="button"
              onClick={() => handleVerify(false)}
              variant="outline"
              className="w-full min-h-[52px] text-base font-medium"
              data-testid="age-verify-no"
              aria-label="I am under 21 years of age — leave site"
            >
              I am under 21
            </Button>
          </div>

          <div
            className="text-xs text-cream-600 space-y-2"
            data-testid="legal-disclaimer"
          >
            <p data-testid="farm-bill-notice">
              This website contains information about hemp products that comply with the 2018 Farm
              Bill.
            </p>
            <div className="flex justify-center gap-6">
              <a
                href="/terms"
                className="transition-colors duration-150 hover:text-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-earth-800"
                data-testid="terms-link"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="transition-colors duration-150 hover:text-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-earth-800"
                data-testid="privacy-link"
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
