/**
 * Bootstrap the first admin user in Supabase.
 *
 * Run once after deploying a fresh Supabase project:
 *   npx tsx scripts/create-admin.ts
 *
 * Required env vars (in .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL         — email for the admin account
 *   ADMIN_PASSWORD      — password (min 8 chars)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  console.error(`
Missing required environment variables. Set these in .env.local or export them:

  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ADMIN_EMAIL
  ADMIN_PASSWORD
`)
  process.exit(1)
}

if (adminPassword.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`Creating admin user: ${adminEmail}`)

  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const alreadyExists = existing?.users.find((u) => u.email === adminEmail)

  if (alreadyExists) {
    // Update to ensure is_admin flag is set
    const { error } = await supabase.auth.admin.updateUserById(alreadyExists.id, {
      user_metadata: { ...alreadyExists.user_metadata, is_admin: true },
    })
    if (error) {
      console.error('Failed to update existing user:', error.message)
      process.exit(1)
    }
    console.log(`✓ Existing user updated — is_admin=true set for ${adminEmail}`)
    return
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,           // skip email confirmation flow
    user_metadata: { is_admin: true },
  })

  if (error) {
    console.error('Failed to create admin user:', error.message)
    process.exit(1)
  }

  console.log(`✓ Admin user created: ${data.user.email} (id: ${data.user.id})`)
  console.log('  You can now log in at /login with those credentials.')
}

main()
