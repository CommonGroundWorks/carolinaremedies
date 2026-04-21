import { NextResponse } from 'next/server'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : ''
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : ''

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Missing session tokens' }, { status: 400 })
  }

  const secure = new URL(request.url).protocol === 'https:'
  const response = NextResponse.json({ ok: true })

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }

  response.cookies.set('sb-access-token', accessToken, cookieOptions)
  response.cookies.set('sb-refresh-token', refreshToken, cookieOptions)

  return response
}