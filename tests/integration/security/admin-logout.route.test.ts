// @vitest-environment node

import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { GET, POST } from '@/app/api/admin/logout/route'

const createRequest = (url: string, host?: string) =>
  new NextRequest(url, {
    method: 'POST',
    headers: host
      ? {
          host,
        }
      : undefined,
  })

describe('admin logout security regression tests', () => {
  it.each([
    ['GET', GET],
    ['POST', POST],
  ])('%s redirects to login and clears auth cookies', async (_method, handler) => {
    const response = await handler(
      createRequest('https://shop.example.com/api/admin/logout', 'shop.example.com')
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://shop.example.com/login')

    const accessCookie = response.cookies.get('sb-access-token')
    const refreshCookie = response.cookies.get('sb-refresh-token')

    expect(accessCookie?.value).toBe('')
    expect(accessCookie?.maxAge).toBe(0)
    expect(accessCookie?.httpOnly).toBe(true)
    expect(accessCookie?.sameSite).toBe('lax')
    expect(accessCookie?.secure).toBe(true)

    expect(refreshCookie?.value).toBe('')
    expect(refreshCookie?.maxAge).toBe(0)
    expect(refreshCookie?.httpOnly).toBe(true)
    expect(refreshCookie?.sameSite).toBe('lax')
    expect(refreshCookie?.secure).toBe(true)
  })

  it('uses the host header instead of the bind address when redirecting', async () => {
    const response = await POST(
      createRequest('http://0.0.0.0:7000/api/admin/logout', 'carolinaremedies.local')
    )

    expect(response.headers.get('location')).toBe('http://carolinaremedies.local/login')
    expect(response.cookies.get('sb-access-token')?.secure).toBe(false)
  })
})