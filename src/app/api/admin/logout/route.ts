import { NextResponse, type NextRequest } from 'next/server'

const clearCookiesAndRedirect = (request: NextRequest) => {
  const secure = request.nextUrl.protocol === 'https:'
  // Use the Host header to avoid redirecting to the 0.0.0.0 bind address
  const host = request.headers.get('host') ?? 'localhost:7000'
  const origin = `${request.nextUrl.protocol}//${host}`
  const response = NextResponse.redirect(`${origin}/login`, { status: 303 })

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 0,
  }

  response.cookies.set('sb-access-token', '', cookieOptions)
  response.cookies.set('sb-refresh-token', '', cookieOptions)
  return response
}

export async function POST(request: NextRequest) {
  return clearCookiesAndRedirect(request)
}

export async function GET(request: NextRequest) {
  return clearCookiesAndRedirect(request)
}
