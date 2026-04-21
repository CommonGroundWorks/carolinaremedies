'use client'

import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react'
import { AgeGateModal } from './age-gate-modal'

interface AgeVerificationContextType {
  isVerified: boolean
  showAgeGate: boolean
  verifyAge: (isOver21: boolean) => void
  resetVerification: () => void
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined)

export function useAgeVerification() {
  const context = useContext(AgeVerificationContext)
  if (context === undefined) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider')
  }
  return context
}

interface AgeVerificationProviderProps {
  children: ReactNode
}

export function AgeVerificationProvider({ children }: AgeVerificationProviderProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [showAgeGate, setShowAgeGate] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [isAccessDenied, setIsAccessDenied] = useState(false)

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifiedFromQuery = params.get('ageVerified') === 'true'

    if (verifiedFromQuery) {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
      params.delete('ageVerified')
      const query = params.toString()
      const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', cleanUrl)
      setIsVerified(true)
      setShowAgeGate(false)
      setInitialized(true)
      return
    }

    // Check if user has already verified their age
    const ageVerified = localStorage.getItem('age-verified')
    const verificationTime = localStorage.getItem('age-verification-time')

    let verified = false
    if (ageVerified === 'true' && verificationTime) {
      // Check if verification is still valid (24 hours)
      const verificationDate = new Date(verificationTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - verificationDate.getTime()) / (1000 * 60 * 60)

      if (hoursDiff < 24) {
        verified = true
      } else {
        // Clear expired verification
        localStorage.removeItem('age-verified')
        localStorage.removeItem('age-verification-time')
      }
    }

    setIsVerified(verified)
    setShowAgeGate(!verified)
    setInitialized(true)
  }, [])

  // Prevent back navigation while age gate is showing (only after initialized)
  useEffect(() => {
    if (!initialized || !showAgeGate) return
    // Push a state so back navigation stays on the current URL
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [showAgeGate, initialized])

  const verifyAge = (isOver21: boolean) => {
    if (isOver21) {
      setIsVerified(true)
      setShowAgeGate(false)
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    }
    // If under 21, modal handles showing access denied
  }

  const handleDeny = () => {
    setIsAccessDenied(true)
    setShowAgeGate(false)
  }

  const resetVerification = () => {
    setIsVerified(false)
    setIsAccessDenied(false)
    setShowAgeGate(true)
    localStorage.removeItem('age-verified')
    localStorage.removeItem('age-verification-time')
  }

  const value = {
    isVerified,
    showAgeGate,
    verifyAge,
    resetVerification
  }

  if (!initialized) {
    return null
  }

  return (
    <AgeVerificationContext.Provider value={value}>
      <AgeGateModal isOpen={showAgeGate} onVerify={verifyAge} onDeny={handleDeny} onReconsider={resetVerification} />
      {!isAccessDenied && (
        <>
          <a
            href="#main-content"
            className="skip-link"
            data-testid="skip-link"
          >
            Skip to main content
          </a>
          {children}
        </>
      )}
    </AgeVerificationContext.Provider>
  )
}
