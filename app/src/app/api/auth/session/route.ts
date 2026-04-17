export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentSession, getUserFirstName } from '@/lib/auth/server'

export async function GET() {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({
    user: {
      ...session.user,
      firstName: getUserFirstName(session.user),
    },
  })
}
