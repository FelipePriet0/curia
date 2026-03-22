import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamBoardResponse } from '@/lib/llm/client'
import { buildSystemPrompt } from '@/lib/llm/board-prompt'
import type { LLMMessage } from '@/lib/llm/client'

// GET /api/conversations/[id]/messages — fetch all messages in a conversation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/conversations/[id]/messages — send a message and stream response
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { message, company_context } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Save user message
  await supabase.from('messages').insert({
    conversation_id: id,
    role: 'user',
    content: message,
  })

  // Fetch conversation history
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  const messages: LLMMessage[] = (history || []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const isFirstMessage = messages.filter((m) => m.role === 'assistant').length === 0
  const system = buildSystemPrompt(company_context)

  // Generate title from first message
  if (isFirstMessage) {
    const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
    await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)
  }

  // Stream LLM response
  const llmStream = await streamBoardResponse({ system, messages })

  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const reader = llmStream.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullResponse += value
          controller.enqueue(encoder.encode(value))
        }
      } finally {
        reader.releaseLock()
        controller.close()

        // Save assistant message after stream completes
        await supabase.from('messages').insert({
          conversation_id: id,
          role: 'assistant',
          content: fullResponse,
        })

        // Touch updated_at
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Transfer-Encoding': 'chunked',
    },
  })
}
