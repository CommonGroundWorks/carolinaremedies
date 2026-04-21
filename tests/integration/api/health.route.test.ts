// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { GET, dynamic, runtime } from '@/app/api/health/route'

describe('health route integration', () => {
  it('is configured for dynamic node execution', () => {
    expect(dynamic).toBe('force-dynamic')
    expect(runtime).toBe('nodejs')
  })

  it('returns an ok health payload with no-store caching', async () => {
    const response = GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')

    const body = await response.json()

    expect(body).toMatchObject({
      status: 'ok',
      service: 'ncremedies-web',
    })
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date')
  })
})