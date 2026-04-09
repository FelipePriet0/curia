import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected   = pathname.startsWith('/board')
  const isOnboarding  = pathname.startsWith('/onboarding')
  const isAuthPage    =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')

  const onboardingDone = user?.user_metadata?.onboarding_completed === true

  // ── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    if (isProtected || isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── Logged in ──────────────────────────────────────────────────────────────

  // Already authed → skip auth pages
  if (isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = onboardingDone ? '/board' : '/onboarding'
    return NextResponse.redirect(url)
  }

  // Trying to access board without completing onboarding
  if (isProtected && !onboardingDone) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Onboarding already done → skip it
  if (isOnboarding && onboardingDone) {
    const url = request.nextUrl.clone()
    url.pathname = '/board'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/board',
    '/board/:path*',
    '/onboarding',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
}
