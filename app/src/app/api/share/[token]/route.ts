export const dynamic = 'force-dynamic'

import { and, asc, eq, isNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, messages, sharedConversations } from '@/db/schema'
import { serializeMessage } from '@/lib/db/serializers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const [share] = await db
    .select({
      conversationId: sharedConversations.conversationId,
    })
    .from(sharedConversations)
    .where(and(
      eq(sharedConversations.token, token),
      isNull(sharedConversations.revokedAt),
    ))
    .limit(1)

  if (!share) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [conversation] = await db
    .select({
      title: conversations.title,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.id, share.conversationId))
    .limit(1)

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, share.conversationId))
    .orderBy(asc(messages.createdAt))

  return NextResponse.json({
    title: conversation.title,
    updated_at: conversation.updatedAt.toISOString(),
    messages: rows.map(serializeMessage),
  })
}
