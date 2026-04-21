'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 sm:py-3 relative z-10">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-4">
        <div className="flex-1 text-sm sm:text-base text-amber-900 font-medium leading-tight">
          <span className="font-bold text-amber-700 mr-2">Educational Project:</span>
          This is an open-source template. No genuine products are sold, and all data is mocked for demonstration purposes.
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="shrink-0 p-1 hover:bg-amber-200/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-700"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
