// @vitest-environment node

import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { GET, POST } from '@/app/api/admin/logout/route'
import { POST as sessionPOST } from '@/app/api/auth/session/route'

// ---------------------------------------------------------------------------
// Admin session & access regression tests
// ---------------------------------------------------------------------------

const makeLogoutRequest = (url = 'https://shop.example.com/api/admin/logout', host?: string) =>
  new NextRequest(url, {
    method: 'POST',
    headers: host ? { host } : undefined,
  })

describe('admin logout — session teardown', () => {
  it('clears both auth cookies and redirects to login on POST', async () => {
    const response = await POST(makeLogoutRequest())

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toContain('/login')

    const access = response.cookies.get('sb-access-token')
    const refresh = response.cookies.get('sb-refresh-token')

    expect(access?.value).toBe('')
    expect(access?.maxAge).toBe(0)
    expect(access?.httpOnly).toBe(true)
    expect(access?.secure).toBe(true)

    expect(refresh?.value).toBe('')
    expect(refresh?.maxAge).toBe(0)
    expect(refresh?.httpOnly).toBe(true)
    expect(refresh?.secure).toBe(true)
  })

  it('clears both auth cookies and redirects to login on GET', async () => {
    const response = await GET(makeLogoutRequest())
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toContain('/login')
    expect(response.cookies.get('sb-access-token')?.maxAge).toBe(0)
  })

  it('redirects to the correct origin based on the Host header', async () => {
    const response = await POST(
      makeLogoutRequest('http://0.0.0.0:7000/api/admin/logout', 'myadmin.example.com')
    )
    expect(response.headers.get('location')).toBe('http://myadmin.example.com/login')
  })

  it('does not mark cookies as secure on plain http', async () => {
    const response = await POST(
      makeLogoutRequest('http://0.0.0.0:7000/api/admin/logout', 'localhost:7000')
    )
    expect(response.cookies.get('sb-access-token')?.secure).toBe(false)
  })

  it('never exposes tokens in the redirect response body', async () => {
    const response = await POST(makeLogoutRequest())
    const body = await response.text()
    expect(body).not.toContain('token')
    expect(body).not.toContain('access')
  })
})

describe('session cookie creation — input validation', () => {
  const makeSessionRequest = (body: unknown, url = 'https://shop.example.com/api/auth/session') =>
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('rejects a request missing both tokens', async () => {
    const response = await sessionPOST(makeSessionRequest({}))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Missing session tokens' })
  })

  it('rejects a request with only an access token', async () => {
    const response = await sessionPOST(makeSessionRequest({ accessToken: 'access-only' }))
    expect(response.status).toBe(400)
  })

  it('rejects a request with only a refresh token', async () => {
    const response = await sessionPOST(makeSessionRequest({ refreshToken: 'refresh-only' }))
    expect(response.status).toBe(400)
  })

  it('rejects malformed JSON bodies', async () => {
    const request = new Request('https://shop.example.com/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    })
    const response = await sessionPOST(request)
    expect(response.status).toBe(400)
  })

  it('sets secure httpOnly cookies on HTTPS', async () => {
    const response = await sessionPOST(
      makeSessionRequest({ accessToken: 'tok-a', refreshToken: 'tok-r' })
    )
    expect(response.status).toBe(200)

    const access = response.cookies.get('sb-access-token')
    const refresh = response.cookies.get('sb-refresh-token')

    expect(access?.value).toBe('tok-a')
    expect(access?.httpOnly).toBe(true)
    expect(access?.sameSite).toBe('lax')
    expect(access?.secure).toBe(true)

    expect(refresh?.value).toBe('tok-r')
    expect(refresh?.httpOnly).toBe(true)
    expect(refresh?.secure).toBe(true)
  })

  it('does not mark cookies as secure on plain http (local dev)', async () => {
    const response = await sessionPOST(
      makeSessionRequest(
        { accessToken: 'local-access', refreshToken: 'local-refresh' },
        'http://localhost:7000/api/auth/session'
      )
    )
    expect(response.status).toBe(200)
    expect(response.cookies.get('sb-access-token')?.secure).toBe(false)
  })

  it('uses a 7-day maxAge for session cookies', async () => {
    const sevenDaysInSeconds = 60 * 60 * 24 * 7
    const response = await sessionPOST(
      makeSessionRequest({ accessToken: 'tok-a', refreshToken: 'tok-r' })
    )
    expect(response.cookies.get('sb-access-token')?.maxAge).toBe(sevenDaysInSeconds)
  })
})
