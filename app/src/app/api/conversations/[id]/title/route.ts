export const dynamic = 'force-dynamic'

import { and, asc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, messages } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { generateConversationTitle } from '@/lib/llm/client'

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

  const rows = await db
    .select({
      content: messages.content,
      role: messages.role,
    })
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .limit(2)

  if (!rows.length) {
    return NextResponse.json({ error: 'No messages found' }, { status: 404 })
  }

  const firstUser = rows.find((row) => row.role === 'user')
  if (!firstUser) {
    return NextResponse.json({ error: 'No user message' }, { status: 404 })
  }

  const title = await generateConversationTitle(firstUser.content)

  const [updated] = await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(and(
      eq(conversations.id, id),
      eq(conversations.userId, session.user.id),
    ))
    .returning({
      id: conversations.id,
      title: conversations.title,
    })

  return NextResponse.json(updated)
}
