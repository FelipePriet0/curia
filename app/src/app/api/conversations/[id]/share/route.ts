export const dynamic = 'force-dynamic'

import { and, eq, isNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, sharedConversations } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params

  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(
      eq(conversations.id, id),
      eq(conversations.userId, session.user.id),
    ))
    .limit(1)

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const token = generateToken()

  const [share] = await db
    .insert(sharedConversations)
    .values({
      userId: session.user.id,
      conversationId: id,
      token,
    })
    .returning({
      token: sharedConversations.token,
    })

  return NextResponse.json({ url: `/share/${share.token}`, token: share.token })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params

  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(
      eq(conversations.id, id),
      eq(conversations.userId, session.user.id),
    ))
    .limit(1)

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .update(sharedConversations)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(sharedConversations.conversationId, id),
      isNull(sharedConversations.revokedAt),
    ))

  return new NextResponse(null, { status: 204 })
}

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Buffer.from(bytes).toString('base64url')
}
