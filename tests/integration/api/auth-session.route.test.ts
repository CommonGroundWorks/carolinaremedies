// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { POST } from '@/app/api/auth/session/route'

const createRequest = (url: string, body: unknown) =>
  new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

describe('auth session route integration', () => {
  it('rejects requests that do not include both session tokens', async () => {
    const response = await POST(
      createRequest('https://shop.example.com/api/auth/session', {
        accessToken: 'access-only',
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Missing session tokens',
    })
  })

  it('sets secure httpOnly cookies for valid https requests', async () => {
    const response = await POST(
      createRequest('https://shop.example.com/api/auth/session', {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })

    const accessCookie = response.cookies.get('sb-access-token')
    const refreshCookie = response.cookies.get('sb-refresh-token')

    expect(accessCookie?.value).toBe('access-token')
    expect(accessCookie?.httpOnly).toBe(true)
    expect(accessCookie?.sameSite).toBe('lax')
    expect(accessCookie?.secure).toBe(true)

    expect(refreshCookie?.value).toBe('refresh-token')
    expect(refreshCookie?.httpOnly).toBe(true)
    expect(refreshCookie?.sameSite).toBe('lax')
    expect(refreshCookie?.secure).toBe(true)
  })

  it('does not mark cookies as secure for plain http local requests', async () => {
    const response = await POST(
      createRequest('http://localhost:7000/api/auth/session', {
        accessToken: 'local-access-token',
        refreshToken: 'local-refresh-token',
      })
    )

    expect(response.cookies.get('sb-access-token')?.secure).toBe(false)
    expect(response.cookies.get('sb-refresh-token')?.secure).toBe(false)
  })
})