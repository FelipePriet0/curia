export const dynamic = 'force-dynamic'

import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeConversation } from '@/lib/db/serializers'

export async function GET(request: NextRequest) {
  const { session, response } = await requireUserSession(request)
  if (!session) return response

  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt))

  return NextResponse.json(rows.map(serializeConversation))
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const body = await req.json().catch(() => ({})) as {
    title?: string
    strategy_id?: string | null
    conversation_type?: 'regular' | 'plan_origin' | 'plan_review' | 'strategy'
  }

  const title = body.title || 'New conversation'
  const strategyId = body.strategy_id ?? null
  const conversationType = strategyId ? 'strategy' : (body.conversation_type ?? 'regular')

  const [conversation] = await db
    .insert(conversations)
    .values({
      userId: session.user.id,
      title,
      strategyId,
      conversationType,
    })
    .returning()

  return NextResponse.json(serializeConversation(conversation), { status: 201 })
}
