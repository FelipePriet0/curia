export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentSession,
  getUserFirstName,
  updateUserFullName,
  upsertCompanyForUser,
} from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    full_name?: string
    company_name?: string
    industry?: string
  }

  const fullName = body.full_name?.trim() ?? ''
  const companyName = body.company_name?.trim() ?? ''
  const industry = body.industry?.trim() ?? ''

  if (!fullName || !companyName || !industry) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const user = await updateUserFullName(session.user.id, fullName)
  await upsertCompanyForUser(session.user.id, {
    companyName,
    industry,
  })

  return NextResponse.json({
    ok: true,
    firstName: user ? getUserFirstName(user) : fullName.split(/\s+/)[0] ?? null,
  })
}
