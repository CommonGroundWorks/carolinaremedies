'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(searchParams.get('error') === 'unauthorized' ? 'You do not have admin access.' : '')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!data.user?.user_metadata?.is_admin) {
        await supabase.auth.signOut()
        setError('You do not have admin access.')
        return
      }

      const session = data.session
      if (session) {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }),
        })

        if (!response.ok) {
          await supabase.auth.signOut()
          setError('Unable to establish an authenticated admin session.')
          return
        }
      }

      router.replace('/admin')
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-earth-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-cream-100 mb-2 text-center">Admin Login</h1>
        <p className="text-cream-500 text-sm text-center mb-8">Sign in to manage your inventory</p>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-900/30 border border-red-700/50 text-red-300 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-wider text-cream-500 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-cream-300/5 border border-cream-300/[0.12] text-cream-200 text-sm focus:outline-none focus:border-primary-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs uppercase tracking-wider text-cream-500 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-cream-300/5 border border-cream-300/[0.12] text-cream-200 text-sm focus:outline-none focus:border-primary-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm uppercase tracking-widest bg-primary-600 text-cream-100 hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-cream-600">
          Public sign-up is disabled. Contact the site owner for access.
        </p>
      </div>
    </div>
  )
}
