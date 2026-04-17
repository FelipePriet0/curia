export const dynamic = 'force-dynamic'

import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, strategies } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeConversation, serializeStrategy } from '@/lib/db/serializers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params

  const [strategy] = await db
    .select()
    .from(strategies)
    .where(and(
      eq(strategies.id, id),
      eq(strategies.userId, session.user.id),
    ))
    .limit(1)

  if (!strategy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rows = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.strategyId, id),
      eq(conversations.userId, session.user.id),
    ))
    .orderBy(desc(conversations.updatedAt))

  return NextResponse.json({
    ...serializeStrategy(strategy),
    conversations: rows.map(serializeConversation),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params
  const body = await req.json().catch(() => ({})) as {
    brief?: string
    stage?: string | null
  }

  if (!body.brief?.trim()) {
    return NextResponse.json({ error: 'brief is required' }, { status: 400 })
  }

  const [strategy] = await db
    .update(strategies)
    .set({
      brief: body.brief.trim(),
      stage: body.stage ?? null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(strategies.id, id),
      eq(strategies.userId, session.user.id),
    ))
    .returning()

  if (!strategy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(serializeStrategy(strategy))
}
