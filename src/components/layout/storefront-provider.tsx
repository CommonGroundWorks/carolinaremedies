'use client'

import * as React from 'react'
import type { SiteSettings } from '@/types/database.types'
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
} from '@/lib/site-settings'

type StorefrontContextValue = {
  settings: SiteSettings
  shoppingEnabled: boolean
  setSettings: (nextSettings: Partial<SiteSettings> | SiteSettings) => void
}

const defaultContextValue: StorefrontContextValue = {
  settings: DEFAULT_SITE_SETTINGS,
  shoppingEnabled: DEFAULT_SITE_SETTINGS.shopping_enabled,
  setSettings: () => undefined,
}

const StorefrontContext =
  React.createContext<StorefrontContextValue>(defaultContextValue)

export interface StorefrontProviderProps {
  initialSettings?: Partial<SiteSettings> | null
  children: React.ReactNode
}

export function StorefrontProvider({
  initialSettings,
  children,
}: StorefrontProviderProps) {
  const [settings, setSettingsState] = React.useState(() =>
    normalizeSiteSettings(initialSettings)
  )

  const setSettings = React.useCallback(
    (nextSettings: Partial<SiteSettings> | SiteSettings) => {
      setSettingsState((currentSettings) =>
        normalizeSiteSettings({
          ...currentSettings,
          ...nextSettings,
        })
      )
    },
    []
  )

  const value = React.useMemo(
    () => ({
      settings,
      shoppingEnabled: settings.shopping_enabled,
      setSettings,
    }),
    [settings, setSettings]
  )

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  )
}

export function useStorefront() {
  return React.useContext(StorefrontContext)
}