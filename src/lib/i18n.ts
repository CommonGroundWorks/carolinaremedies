/**
 * Text Internationalization System for NCRemedies
 * Simple, extensible text management without complex i18n libraries
 */

import en from '../../locales/en.json'

type TextObject = typeof en
type TextKey = string // Dot-notation keys like 'products.labels.addToCart'

// Cache for performance
const textCache = new Map<string, string>()

/**
 * Get translated text by dot-notation key
 * @param key - Dot-notation key (e.g., 'products.labels.addToCart')
 * @param variables - Variables to replace in the text (e.g., {count: 5})
 * @returns Translated text or the key if not found
 */
export const t = (key: TextKey, variables?: Record<string, any>): string => {
  // Check cache first for performance
  const cacheKey = `${key}:${JSON.stringify(variables || {})}`
  if (textCache.has(cacheKey)) {
    return textCache.get(cacheKey)!
  }

  // Navigate through the text object using dot notation
  const keys = key.split('.')
  let value: any = en
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }
  
  // If not found, return the key itself (useful for development)
  if (typeof value !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Translation key not found: ${key}`)
    }
    return key
  }
  
  // Replace variables in the text
  let result = value
  if (variables) {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      const placeholder = `{${varKey}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(varValue))
    })
  }
  
  // Cache the result for future use
  textCache.set(cacheKey, result)
  
  return result
}

/**
 * Get all texts for a specific section
 * @param section - Section key (e.g., 'products.labels')
 * @returns Object with all texts in that section
 */
export const getSection = (section: TextKey): Record<string, string> => {
  const keys = section.split('.')
  let value: any = en
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) return {}
  }
  
  return typeof value === 'object' ? value : {}
}

/**
 * Get category names for dynamic use
 */
export const getCategoryNames = () => getSection('products.categories')

/**
 * Get product labels for dynamic use
 */
export const getProductLabels = () => getSection('products.labels')

/**
 * Get navigation items for dynamic use
 */
export const getNavigationItems = () => getSection('navigation')

/**
 * Get validation messages with dynamic content
 */
export const getValidationMessage = (type: string, options?: Record<string, any>): string => {
  return t(`validation.${type}`, options)
}

/**
 * Custom hook for text translations in React components
 */
export const useTranslation = () => {
  return {
    t,
    getSection,
    getCategoryNames,
    getProductLabels,
    getNavigationItems,
    getValidationMessage
  }
}

/**
 * Format currency with proper locale
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Format date with proper locale
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(dateObj)
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  
  const diffInMs = dateObj.getTime() - Date.now()
  const diffInMinutes = Math.round(diffInMs / (1000 * 60))
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))
  
  if (Math.abs(diffInDays) >= 1) {
    return rtf.format(diffInDays, 'day')
  } else if (Math.abs(diffInHours) >= 1) {
    return rtf.format(diffInHours, 'hour')
  } else {
    return rtf.format(diffInMinutes, 'minute')
  }
}

/**
 * Get text for pluralization
 */
export const getPlural = (count: number, singular: TextKey, plural?: TextKey): string => {
  if (count === 1) {
    return t(singular, { count })
  }
  
  if (plural) {
    return t(plural, { count })
  }
  
  // Try to get plural from the same key with "Plural" suffix
  const pluralKey = `${singular}Plural`
  const pluralText = t(pluralKey, { count })
  
  // If plural key doesn't exist, just use the singular
  return pluralText === pluralKey ? t(singular, { count }) : pluralText
}

/**
 * Clear text cache (useful for development/testing)
 */
export const clearTextCache = () => {
  textCache.clear()
}

/**
 * Get text with fallback
 */
export const tWithFallback = (key: TextKey, fallback: string, variables?: Record<string, any>): string => {
  const result = t(key, variables)
  return result === key ? fallback : result
}

// Export for direct access if needed
export { en as defaultTexts }

// Pre-load commonly used texts for better performance
export const preloadTexts = () => {
  const commonKeys = [
    'common.loading',
    'common.error',
    'products.labels.addToCart',
    'cart.title',
    'navigation.home',
    'navigation.shop'
  ]
  
  commonKeys.forEach(key => t(key))
}