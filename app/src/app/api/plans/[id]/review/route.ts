export const dynamic = 'force-dynamic'

import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, plans } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeConversation } from '@/lib/db/serializers'
import { trackEvent } from '@/lib/metrics/track'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params

  const [plan] = await db
    .select({
      id: plans.id,
      title: plans.title,
      status: plans.status,
    })
    .from(plans)
    .where(and(
      eq(plans.id, id),
      eq(plans.userId, session.user.id),
    ))
    .limit(1)

  if (!plan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      userId: session.user.id,
      title: `Revisão — ${plan.title}`,
      planId: id,
      conversationType: 'plan_review',
    })
    .returning()

  if (plan.status === 'active') {
    await db
      .update(plans)
      .set({
        status: 'reviewed',
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))
  }

  await trackEvent({
    userId: session.user.id,
    conversationId: conversation.id,
    type: 'review_completed',
    metadata: { plan_id: id },
  })

  return NextResponse.json(serializeConversation(conversation), { status: 201 })
}
