export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { userTermsAcceptances } from '@/db/schema'
import { getCurrentSession, hasAcceptedTermsVersion } from '@/lib/auth/server'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const termsVersion = process.env.NEXT_PUBLIC_TERMS_VERSION || '1.0'
  const accepted = await hasAcceptedTermsVersion(session.user.id, termsVersion)
  return NextResponse.json({ accepted, terms_version: termsVersion })
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { terms_version?: string }
  const termsVersion = body.terms_version || process.env.NEXT_PUBLIC_TERMS_VERSION || '1.0'

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent') || null

  await db.insert(userTermsAcceptances).values({
    userId: session.user.id,
    termsVersion,
    ip,
    userAgent,
  })

  return NextResponse.json({ ok: true })
}
