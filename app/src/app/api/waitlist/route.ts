import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { waitlistLeads } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  let email: string
  let name: string | undefined
  let whatsapp: string | undefined
  let source: string | undefined

  try {
    const body = await req.json() as { email?: unknown; name?: unknown; whatsapp?: unknown; source?: unknown }
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : undefined
    whatsapp = typeof body.whatsapp === 'string' && body.whatsapp.trim() ? body.whatsapp.trim() : undefined
    source = typeof body.source === 'string' ? body.source : undefined
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 422 })
  }

  const existing = await db
    .select({ id: waitlistLeads.id })
    .from(waitlistLeads)
    .where(eq(waitlistLeads.email, email))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  await db.insert(waitlistLeads).values({ email, name, whatsapp, source })

  return NextResponse.json({ ok: true, duplicate: false }, { status: 201 })
}
