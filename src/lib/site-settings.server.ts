import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase'
import {
  DEFAULT_SITE_SETTINGS,
  STOREFRONT_SETTINGS_ID,
  normalizeSiteSettings,
} from '@/lib/site-settings'

export async function getSiteSettings() {
  noStore()

  // Skip DB call when Supabase is not configured (local dev without a project)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
    return DEFAULT_SITE_SETTINGS
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', STOREFRONT_SETTINGS_ID)
      .maybeSingle()

    if (error) {
      const msg = (error as { message?: string }).message ?? JSON.stringify(error)
      console.warn('Site settings unavailable (using defaults):', msg)
      return DEFAULT_SITE_SETTINGS
    }

    return normalizeSiteSettings(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('Site settings unavailable (using defaults):', msg)
    return DEFAULT_SITE_SETTINGS
  }
}