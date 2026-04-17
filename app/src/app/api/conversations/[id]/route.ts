export const dynamic = 'force-dynamic'

import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeConversation } from '@/lib/db/serializers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params
  const body = await req.json().catch(() => ({})) as {
    title?: string
    pinned?: boolean
    archived?: boolean
  }

  const updates: Partial<typeof conversations.$inferInsert> & { updatedAt?: Date } = {}
  if ('title' in body) updates.title = body.title
  if ('pinned' in body) updates.pinned = body.pinned
  if ('archived' in body) updates.archived = body.archived

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  updates.updatedAt = new Date()

  const [conversation] = await db
    .update(conversations)
    .set(updates)
    .where(and(
      eq(conversations.id, id),
      eq(conversations.userId, session.user.id),
    ))
    .returning()

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(serializeConversation(conversation))
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params

  const deleted = await db
    .delete(conversations)
    .where(and(
      eq(conversations.id, id),
      eq(conversations.userId, session.user.id),
    ))
    .returning({ id: conversations.id })

  if (!deleted.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
