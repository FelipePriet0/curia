export const dynamic = 'force-dynamic'

import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, plans } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializePlan } from '@/lib/db/serializers'
import { trackEvent } from '@/lib/metrics/track'

export async function GET(request: NextRequest) {
  const { session, response } = await requireUserSession(request)
  if (!session) return response

  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, session.user.id))
    .orderBy(desc(plans.createdAt))

  return NextResponse.json(rows.map(serializePlan))
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const body = await req.json().catch(() => ({})) as {
    conversation_id?: string | null
    title?: string
    summary?: string
    next_steps?: string
    metrics?: Record<string, unknown> | null
    framework_used?: string | null
    review_date?: string | null
    review_interval_days?: number | null
  }

  if (!body.title || !body.summary || !body.next_steps) {
    return NextResponse.json({ error: 'title, summary and next_steps are required' }, { status: 400 })
  }

  if (body.conversation_id) {
    const [conversation] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(
        eq(conversations.id, body.conversation_id),
        eq(conversations.userId, session.user.id),
      ))
      .limit(1)

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
  }

  const [plan] = await db
    .insert(plans)
    .values({
      userId: session.user.id,
      originConversationId: body.conversation_id || null,
      title: body.title,
      summary: body.summary,
      nextSteps: body.next_steps,
      metrics: body.metrics ?? null,
      frameworkUsed: body.framework_used ?? null,
      reviewDate: body.review_date || null,
      reviewIntervalDays: body.review_interval_days || 14,
    })
    .returning()

  if (body.conversation_id) {
    await db
      .update(conversations)
      .set({
        conversationType: 'plan_origin',
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, body.conversation_id))
  }

  await trackEvent({
    userId: session.user.id,
    conversationId: body.conversation_id ?? undefined,
    type: 'plan_created',
    metadata: { plan_id: plan.id },
  })

  if (body.review_date) {
    await trackEvent({
      userId: session.user.id,
      conversationId: body.conversation_id ?? undefined,
      type: 'review_scheduled',
      metadata: { plan_id: plan.id, review_date: body.review_date },
    })
  }

  return NextResponse.json(serializePlan(plan), { status: 201 })
}
