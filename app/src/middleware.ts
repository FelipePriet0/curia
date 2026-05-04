import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PATHS = new Set([
  '/',
  '/lp',
  '/privacy',
  '/termos',
  '/terms',
  '/cookies',
  '/cookies/policy',
])

const ALLOWED_PREFIXES = [
  '/_next/',
  '/api/waitlist',
  '/favicon',
]

export function middleware(req: NextRequest) {
  if (process.env.WAITLIST_MODE !== 'true') {
    return NextResponse.next()
  }

  const { pathname } = req.nextUrl

  if (ALLOWED_PATHS.has(pathname)) return NextResponse.next()
  if (ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/'
  url.hash = 'waitlist'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
}
