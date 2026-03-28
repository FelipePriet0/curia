import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamBoardResponse } from '@/lib/llm/client'
import { buildSystemPrompt } from '@/lib/llm/board-prompt'
import { STRATEGY_PROPOSAL_MARKER } from '@/lib/llm/client'
import type { LLMMessage } from '@/lib/llm/client'
import type { PlanReviewContext, StrategyContext } from '@/types'
import { isPlanRequest, hasDiagnosis, hasProblemCentral, stripStrategyMarker } from '@/lib/metrics/detectors'
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

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, plan_id, conversation_type, strategy_id')
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

  await supabase.from('messages').insert({
    conversation_id: id,
    role: 'user',
    content: message,
  })

  if (isPlanRequest(message)) {
    await trackEvent(supabase as any, {
      userId: user.id,
      conversationId: id,
      type: 'plan_requested',
    })
  }

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

  // Fetch plan context for review conversations
  let planReview: PlanReviewContext | undefined
  if (conversation.conversation_type === 'plan_review' && conversation.plan_id) {
    const { data: plan } = await supabase
      .from('plans')
      .select('id, title, summary, next_steps, metrics, framework_used, created_at, review_date')
      .eq('id', conversation.plan_id)
      .single()
    if (plan) planReview = plan as PlanReviewContext
  }

  // Fetch strategy context (Plano 5)
  let strategyContext: StrategyContext | undefined
  if (conversation.strategy_id) {
    const { data: strategy } = await supabase
      .from('strategies')
      .select('name, brief, stage')
      .eq('id', conversation.strategy_id)
      .single()
    if (strategy) strategyContext = strategy as StrategyContext
  }

  const system = buildSystemPrompt(company_context, planReview, strategyContext)

  if (isFirstMessage) {
    const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
    await supabase.from('conversations').update({ title }).eq('id', id)

    await trackEvent(supabase as any, {
      userId: user.id,
      conversationId: id,
      type: 'conversation_started',
    })

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', (
        await supabase.from('conversations').select('id').eq('user_id', user.id)
      ).data?.map((c: any) => c.id) || [])

    if ((count ?? 0) <= 1) {
      await trackEvent(supabase as any, {
        userId: user.id,
        conversationId: id,
        type: 'activation_started',
      })
    }
  }

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

        // Strip strategy marker before saving to DB (marker is handled by front-end)
        const contentToSave = stripStrategyMarker(fullResponse)

        const { data: savedAssistant } = await supabase.from('messages').insert({
          conversation_id: id,
          role: 'assistant',
          content: contentToSave,
        }).select().single()

        if (fullResponse && hasDiagnosis(fullResponse) && hasProblemCentral(fullResponse)) {
          await trackEvent(supabase as any, {
            userId: user.id,
            conversationId: id,
            type: 'flow_progressed',
            metadata: { message_id: savedAssistant?.id },
          })
        }

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
