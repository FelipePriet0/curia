export const dynamic = 'force-dynamic'

import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, strategies } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeStrategy } from '@/lib/db/serializers'

export async function GET(request: NextRequest) {
  const { session, response } = await requireUserSession(request)
  if (!session) return response

  const rows = await db
    .select()
    .from(strategies)
    .where(eq(strategies.userId, session.user.id))
    .orderBy(desc(strategies.updatedAt))

  return NextResponse.json(rows.map(serializeStrategy))
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const body = await req.json().catch(() => ({})) as {
    name?: string
    brief?: string
    stage?: string | null
    conversation_id?: string | null
  }

  if (!body.name?.trim() || !body.brief?.trim()) {
    return NextResponse.json({ error: 'name and brief are required' }, { status: 400 })
  }

  const [strategy] = await db
    .insert(strategies)
    .values({
      userId: session.user.id,
      name: body.name.trim(),
      brief: body.brief.trim(),
      stage: body.stage ?? null,
    })
    .returning()

  if (body.conversation_id) {
    await db
      .update(conversations)
      .set({
        strategyId: strategy.id,
        conversationType: 'strategy',
        updatedAt: new Date(),
      })
      .where(and(
        eq(conversations.id, body.conversation_id),
        eq(conversations.userId, session.user.id),
      ))
  }

  return NextResponse.json(serializeStrategy(strategy), { status: 201 })
}
