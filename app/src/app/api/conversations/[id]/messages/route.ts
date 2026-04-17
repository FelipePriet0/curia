export const maxDuration = 300
export const dynamic = 'force-dynamic'

import { and, asc, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { companies, conversations, messages, plans, strategies } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeCompany, serializeMessage } from '@/lib/db/serializers'
import { buildSystemPrompt } from '@/lib/llm/board-prompt'
import { streamBoardEvents } from '@/lib/llm/client'
import type { LLMMessage } from '@/lib/llm/client'
import type { QueryEvent } from '@/lib/llm/query-loop'
import { hasDiagnosis, hasProblemCentral, isPlanRequest } from '@/lib/metrics/detectors'
import { trackEvent } from '@/lib/metrics/track'
import type { CompanyContext, PlanReviewContext, StrategyContext } from '@/types'

export async function GET(
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
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))

  return NextResponse.json(rows.map(serializeMessage))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id } = await params

  const [conversation] = await db
    .select({
      id: conversations.id,
      planId: conversations.planId,
      conversationType: conversations.conversationType,
      strategyId: conversations.strategyId,
    })
    .from(conversations)
    .where(and(
      eq(conversations.id, id),
      eq(conversations.userId, session.user.id),
    ))
    .limit(1)

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({})) as { message?: string }
  const message = body.message?.trim()

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const [companyRow] = await db
    .select()
    .from(companies)
    .where(eq(companies.userId, session.user.id))
    .limit(1)

  const serializedCompany = companyRow ? serializeCompany(companyRow) : null
  const companyContext: CompanyContext | undefined = serializedCompany ? {
    company_name: serializedCompany.company_name,
    industry: serializedCompany.industry ?? undefined,
    business_type: serializedCompany.business_type ?? undefined,
    business_model: serializedCompany.business_model ?? undefined,
    monetization: serializedCompany.monetization ?? undefined,
    product_description: serializedCompany.product_description ?? undefined,
    average_ticket: serializedCompany.average_ticket ?? undefined,
    employees: serializedCompany.team_size ?? undefined,
    founded_period: serializedCompany.founded_period ?? undefined,
    capital_stage: serializedCompany.capital_stage ?? undefined,
    mrr: serializedCompany.mrr ?? undefined,
    churn_rate: serializedCompany.churn_rate ?? undefined,
    cac: serializedCompany.cac ?? undefined,
    ltv: serializedCompany.ltv ?? undefined,
    monthly_revenue: serializedCompany.monthly_revenue ?? undefined,
    gross_margin: serializedCompany.gross_margin ?? undefined,
    max_capacity: serializedCompany.max_capacity ?? undefined,
    gmv: serializedCompany.gmv ?? undefined,
    take_rate: serializedCompany.take_rate ?? undefined,
    marketplace_weak_side: serializedCompany.marketplace_weak_side ?? undefined,
    active_customers: serializedCompany.active_customers ?? undefined,
    icp_defined: serializedCompany.icp_defined,
    icp_description: serializedCompany.icp_description ?? undefined,
    acquisition_channel: serializedCompany.acquisition_channel ?? undefined,
    main_bottleneck: serializedCompany.main_bottleneck ?? undefined,
    main_bottleneck_detail: serializedCompany.main_bottleneck_detail ?? undefined,
    diagnosed_stage: serializedCompany.diagnosed_stage ?? undefined,
    diagnostic_summary: serializedCompany.diagnostic_summary ?? undefined,
    priority_ladder: serializedCompany.priority_ladder as CompanyContext['priority_ladder'],
  } : undefined

  await db.insert(messages).values({
    conversationId: id,
    role: 'user',
    content: message,
  })

  if (isPlanRequest(message)) {
    await trackEvent({
      userId: session.user.id,
      conversationId: id,
      type: 'plan_requested',
    })
  }

  const historyRows = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))

  const llmMessages: LLMMessage[] = historyRows.map((row) => ({
    role: row.role,
    content: row.content,
  }))

  const isFirstMessage = historyRows.filter((row) => row.role === 'assistant').length === 0

  let planReview: PlanReviewContext | undefined
  if (conversation.conversationType === 'plan_review' && conversation.planId) {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, conversation.planId))
      .limit(1)

    if (plan) {
      planReview = {
        id: plan.id,
        title: plan.title,
        summary: plan.summary,
        next_steps: plan.nextSteps,
        metrics: (plan.metrics as Record<string, string> | null) ?? null,
        framework_used: plan.frameworkUsed,
        created_at: plan.createdAt.toISOString(),
        review_date: plan.reviewDate,
      }
    }
  }

  let strategyContext: StrategyContext | undefined
  if (conversation.strategyId) {
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.id, conversation.strategyId))
      .limit(1)

    if (strategy) {
      strategyContext = {
        name: strategy.name,
        brief: strategy.brief,
        stage: strategy.stage,
      }
    }
  }

  const system = buildSystemPrompt(companyContext, planReview, strategyContext)

  if (isFirstMessage) {
    const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
    await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id))

    await trackEvent({
      userId: session.user.id,
      conversationId: id,
      type: 'conversation_started',
    })

    const [{ totalMessages }] = await db
      .select({ totalMessages: count(messages.id) })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.userId, session.user.id))

    if ((totalMessages ?? 0) <= 1) {
      await trackEvent({
        userId: session.user.id,
        conversationId: id,
        type: 'activation_started',
      })
    }
  }

  const eventStream = streamBoardEvents({ system, messages: llmMessages, signal: req.signal })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const reader = eventStream.getReader()

      let fullText = ''
      let savedAssistantId: string | null = null

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const lines = value.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              const event = JSON.parse(trimmed) as QueryEvent
              if (event.type === 'delta') fullText += event.text
            } catch {}
          }

          controller.enqueue(encoder.encode(value))
        }
      } finally {
        reader.releaseLock()
        controller.close()

        const [savedAssistant] = await db
          .insert(messages)
          .values({
            conversationId: id,
            role: 'assistant',
            content: fullText,
          })
          .returning({ id: messages.id })

        savedAssistantId = savedAssistant?.id ?? null

        if (fullText && hasDiagnosis(fullText) && hasProblemCentral(fullText)) {
          await trackEvent({
            userId: session.user.id,
            conversationId: id,
            type: 'flow_progressed',
            metadata: { message_id: savedAssistantId },
          })
        }

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, id))
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
