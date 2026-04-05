import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { terms_version?: string }
  const termsVersion = body.terms_version || process.env.NEXT_PUBLIC_TERMS_VERSION || '1.0'

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent') || null

  const admin = createAdmin()
  const { error: insertError } = await admin.from('user_terms_acceptances').insert({
    user_id: user.id,
    terms_version: termsVersion,
    ip: ip ?? undefined,
    user_agent: userAgent ?? undefined,
  })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

