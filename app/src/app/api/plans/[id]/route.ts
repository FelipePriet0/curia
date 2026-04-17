export const dynamic = 'force-dynamic'

import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, plans } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeConversation, serializePlan } from '@/lib/db/serializers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(
      eq(plans.id, id),
      eq(plans.userId, session.user.id),
    ))
    .limit(1)

  if (!plan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const reviews = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.planId, id),
      eq(conversations.conversationType, 'plan_review'),
      eq(conversations.userId, session.user.id),
    ))
    .orderBy(desc(conversations.createdAt))

  return NextResponse.json({
    ...serializePlan(plan),
    reviews: reviews.map(serializeConversation),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params
  const [existing] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(and(
      eq(plans.id, id),
      eq(plans.userId, session.user.id),
    ))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({})) as {
    status?: 'active' | 'reviewed' | 'archived'
    review_date?: string | null
    review_interval_days?: number
    title?: string
  }

  const updates: Partial<typeof plans.$inferInsert> & { updatedAt?: Date } = {}
  if ('status' in body) updates.status = body.status
  if ('review_date' in body) updates.reviewDate = body.review_date ?? null
  if ('review_interval_days' in body) updates.reviewIntervalDays = body.review_interval_days
  if ('title' in body) updates.title = body.title

  updates.updatedAt = new Date()

  const [plan] = await db
    .update(plans)
    .set(updates)
    .where(and(
      eq(plans.id, id),
      eq(plans.userId, session.user.id),
    ))
    .returning()

  return NextResponse.json(serializePlan(plan))
}
