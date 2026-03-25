import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamBoardResponse } from '@/lib/llm/client'
import { buildSystemPrompt } from '@/lib/llm/board-prompt'
import type { LLMMessage } from '@/lib/llm/client'
import type { PlanReviewContext } from '@/types'
import { isPlanRequest, hasDiagnosis, hasProblemCentral } from '@/lib/metrics/detectors'
import { trackEvent } from '@/lib/metrics/track'

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

  // Verify ownership and fetch conversation metadata
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, plan_id, conversation_type')
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

  // Metrics: plan requested
  if (isPlanRequest(message)) {
    await trackEvent(supabase as any, {
      userId: user.id,
      conversationId: id,
      type: 'plan_requested',
    })
  }

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

  // Fetch plan context if this is a review conversation
  let planReview: PlanReviewContext | undefined
  if (conversation.conversation_type === 'plan_review' && conversation.plan_id) {
    const { data: plan } = await supabase
      .from('plans')
      .select('id, title, summary, next_steps, metrics, framework_used, created_at, review_date')
      .eq('id', conversation.plan_id)
      .single()
    if (plan) planReview = plan as PlanReviewContext
  }

  const system = buildSystemPrompt(company_context, planReview)

  // Generate title from first message
  if (isFirstMessage) {
    const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
    await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)

    // Metrics: conversation started
    await trackEvent(supabase as any, {
      userId: user.id,
      conversationId: id,
      type: 'conversation_started',
    })

    // Metrics: activation started (first-ever message across all conversations)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', (
        await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
      ).data?.map((c: any) => c.id) || []
      )

    if ((count ?? 0) <= 1) {
      await trackEvent(supabase as any, {
        userId: user.id,
        conversationId: id,
        type: 'activation_started',
      })
    }
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
        const { data: savedAssistant } = await supabase.from('messages').insert({
          conversation_id: id,
          role: 'assistant',
          content: fullResponse,
        }).select().single()

        // Metrics: flow progressed (diagnosis + problem central present)
        if (fullResponse && hasDiagnosis(fullResponse) && hasProblemCentral(fullResponse)) {
          await trackEvent(supabase as any, {
            userId: user.id,
            conversationId: id,
            type: 'flow_progressed',
            metadata: { message_id: savedAssistant?.id },
          })
        }

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
