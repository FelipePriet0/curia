import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCurrentSession } from './server'

export async function requireUserSession(_request: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { session, response: null }
}
