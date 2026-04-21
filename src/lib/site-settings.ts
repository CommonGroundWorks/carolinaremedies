import type { SiteSettings } from '@/types/database.types'

export const STOREFRONT_SETTINGS_ID = 'storefront'

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: STOREFRONT_SETTINGS_ID,
  shopping_enabled: false,
  updated_at: null,
}

export function normalizeSiteSettings(
  settings?: Partial<SiteSettings> | null
): SiteSettings {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...settings,
    id: settings?.id ?? STOREFRONT_SETTINGS_ID,
    shopping_enabled:
      settings?.shopping_enabled ?? DEFAULT_SITE_SETTINGS.shopping_enabled,
    updated_at: settings?.updated_at ?? DEFAULT_SITE_SETTINGS.updated_at,
  }
}