import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateConversationTitle } from '@/lib/llm/client'

// POST /api/conversations/[id]/title — generate and save an AI title
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch first user message
  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('content, role')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(2)

  if (msgErr || !messages?.length)
    return NextResponse.json({ error: 'No messages found' }, { status: 404 })

  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return NextResponse.json({ error: 'No user message' }, { status: 404 })

  const title = await generateConversationTitle(firstUser.content)

  const { data, error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, title')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
