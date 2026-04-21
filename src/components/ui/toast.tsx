/**
 * Toast / Notification System
 * Renders global toasts from ui-store into #toast-root.
 * Supports success · error · warning · info with product-aware messages.
 */

'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useNotifications } from '@/lib/stores'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const

const COLOR_MAP = {
  success: 'border-primary-500/40 bg-primary-500/10 text-primary-400',
  error: 'border-[var(--destructive)]/40 bg-[var(--destructive)]/10 text-[var(--destructive)]',
  warning: 'border-secondary-400/40 bg-secondary-400/10 text-secondary-400',
  info: 'border-cream-400/30 bg-cream-300/5 text-cream-300',
} as const

const ICON_COLOR_MAP = {
  success: 'text-primary-400',
  error: 'text-[var(--destructive)]',
  warning: 'text-secondary-400',
  info: 'text-cream-400',
} as const

function ToastItem({
  id,
  type,
  title,
  message,
}: {
  id: string
  type: keyof typeof ICON_MAP
  title: string
  message?: string
}) {
  const { remove } = useNotifications()
  const Icon = ICON_MAP[type]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="cart-notification"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm px-4 py-3 border shadow-lg',
        'bg-earth-900 backdrop-blur-sm',
        COLOR_MAP[type]
      )}
    >
      <Icon
        className={cn('h-4 w-4 mt-0.5 flex-shrink-0', ICON_COLOR_MAP[type])}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream-100 leading-snug">{title}</p>
        {message && (
          <p className="text-xs mt-0.5 text-cream-500 leading-snug">{message}</p>
        )}
      </div>
      <button
        onClick={() => remove(id)}
        className="pointer-events-auto flex-shrink-0 p-1 -m-1 transition-opacity duration-150 hover:opacity-60 text-cream-500"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { notifications } = useNotifications()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const root = document.getElementById('toast-root')
  if (!root) return null

  return createPortal(
    <div
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-[env(safe-area-inset-bottom,1.5rem)] right-4 sm:right-6 z-[200] flex flex-col gap-2 pointer-events-none pb-safe max-w-[calc(100vw-2rem)] sm:max-w-sm"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
    >
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <ToastItem
            id={n.id}
            type={n.type}
            title={n.title}
            message={n.message}
          />
        </div>
      ))}
    </div>,
    root
  )
}
