export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamBoardEvents } from '@/lib/llm/client'
import { buildSystemPrompt } from '@/lib/llm/board-prompt'
import type { LLMMessage } from '@/lib/llm/client'
import type { QueryEvent } from '@/lib/llm/query-loop'
import type { PlanReviewContext, StrategyContext, StrategyProposal } from '@/types'
import { isPlanRequest, hasDiagnosis, hasProblemCentral } from '@/lib/metrics/detectors'
import { trackEvent } from '@/lib/metrics/track'

// GET /api/conversations/[id]/messages — buscar todas as mensagens
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

// POST /api/conversations/[id]/messages — enviar mensagem e stream NDJSON
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

  const { message } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Buscar dados completos da empresa do banco — inclui métricas e diagnóstico do onboarding
  const { data: companyRow } = await supabase
    .from('companies')
    .select([
      'company_name', 'industry', 'business_type', 'business_model', 'monetization',
      'product_description', 'average_ticket', 'team_size', 'founded_period', 'capital_stage',
      'mrr', 'churn_rate', 'cac', 'ltv',
      'monthly_revenue', 'gross_margin', 'max_capacity',
      'gmv', 'take_rate', 'marketplace_weak_side',
      'active_customers', 'icp_defined', 'icp_description', 'acquisition_channel',
      'main_bottleneck', 'main_bottleneck_detail',
      'diagnosed_stage', 'diagnostic_summary', 'priority_ladder',
    ].join(', '))
    .eq('user_id', user.id)
    .maybeSingle()

  const company_context = companyRow
    ? {
        company_name:          companyRow.company_name,
        industry:              companyRow.industry,
        business_type:         companyRow.business_type,
        business_model:        companyRow.business_model,
        monetization:          companyRow.monetization,
        product_description:   companyRow.product_description,
        average_ticket:        companyRow.average_ticket,
        employees:             companyRow.team_size,
        founded_period:        companyRow.founded_period,
        capital_stage:         companyRow.capital_stage,
        mrr:                   companyRow.mrr,
        churn_rate:            companyRow.churn_rate,
        cac:                   companyRow.cac,
        ltv:                   companyRow.ltv,
        monthly_revenue:       companyRow.monthly_revenue,
        gross_margin:          companyRow.gross_margin,
        max_capacity:          companyRow.max_capacity,
        gmv:                   companyRow.gmv,
        take_rate:             companyRow.take_rate,
        marketplace_weak_side: companyRow.marketplace_weak_side,
        active_customers:      companyRow.active_customers,
        icp_defined:           companyRow.icp_defined,
        icp_description:       companyRow.icp_description,
        acquisition_channel:   companyRow.acquisition_channel,
        main_bottleneck:       companyRow.main_bottleneck,
        main_bottleneck_detail: companyRow.main_bottleneck_detail,
        diagnosed_stage:       companyRow.diagnosed_stage,
        diagnostic_summary:    companyRow.diagnostic_summary,
        priority_ladder:       companyRow.priority_ladder,
      }
    : undefined

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

  // Contexto de revisão de plano
  let planReview: PlanReviewContext | undefined
  if (conversation.conversation_type === 'plan_review' && conversation.plan_id) {
    const { data: plan } = await supabase
      .from('plans')
      .select('id, title, summary, next_steps, metrics, framework_used, created_at, review_date')
      .eq('id', conversation.plan_id)
      .single()
    if (plan) planReview = plan as PlanReviewContext
  }

  // Contexto de estratégia
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

  const eventStream = streamBoardEvents({ system, messages, signal: req.signal })

  // ── Readable stream: emite eventos NDJSON e salva no DB ao final ────────────
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const reader = eventStream.getReader()

      let fullText = ''
      let strategyProposal: StrategyProposal | null = null

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Parsear eventos para extrair texto e strategy proposal
          const lines = value.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              const event = JSON.parse(trimmed) as QueryEvent
              if (event.type === 'delta') fullText += event.text
              if (event.type === 'done' && event.strategyProposal) {
                strategyProposal = event.strategyProposal
              }
            } catch {}
          }

          controller.enqueue(encoder.encode(value))
        }
      } finally {
        reader.releaseLock()
        controller.close()

        // ── Salvar resposta no DB ──────────────────────────────────────────────
        const { data: savedAssistant } = await supabase.from('messages').insert({
          conversation_id: id,
          role: 'assistant',
          content: fullText,
        }).select().single()

        if (fullText && hasDiagnosis(fullText) && hasProblemCentral(fullText)) {
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
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
