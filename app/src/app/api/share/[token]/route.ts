import { NextRequest, NextResponse } from 'next/server'
import { createAdmin } from '@/lib/supabase/admin'

// GET /api/share/[token] — public, read-only snapshot
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdmin()

  // Resolve the conversation by token (must not be revoked)
  const { data: share } = await admin
    .from('shared_conversations')
    .select('conversation_id, revoked_at')
    .eq('token', token)
    .single()

  if (!share || share.revoked_at) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Fetch conversation title
  const { data: conv } = await admin
    .from('conversations')
    .select('id, title, updated_at')
    .eq('id', share.conversation_id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch messages (ordered)
  const { data: messages } = await admin
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    title: conv.title,
    updated_at: conv.updated_at,
    messages: messages ?? [],
  })
}

