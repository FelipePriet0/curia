// POST /api/messages/:id/feedback
//
// Camada 1 de medição do A/B do COUNCIL_MODE. Captura feedback tipado sobre
// uma resposta específica do assistant. Múltiplos feedbacks por mensagem são
// permitidos (mesmo founder reavaliando, advisor externo, revisão interna).
//
// Corpo esperado (todos opcionais, mas pelo menos thumbs OU rating obrigatório):
//   {
//     thumbs?: 'up' | 'down',
//     rating?: 1..5,
//     dimensions?: { utility?, rigor?, generic?, actionable? }, cada 1..5
//     comment?: string,
//     evaluator_role?: 'founder' | 'advisor' | 'internal',   default: 'founder'
//   }

import { and, asc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { conversations, messageFeedbacks, messages } from '@/db/schema'
import { requireUserSession } from '@/lib/auth/request'
import { serializeMessageFeedback } from '@/lib/db/serializers'

export const dynamic = 'force-dynamic'

const VALID_THUMBS = ['up', 'down'] as const
const VALID_ROLES = ['founder', 'advisor', 'internal'] as const
const VALID_DIMENSIONS = ['utility', 'rigor', 'generic', 'actionable'] as const

type Thumbs = typeof VALID_THUMBS[number]
type EvaluatorRole = typeof VALID_ROLES[number]

interface FeedbackBody {
  thumbs?: Thumbs
  rating?: number
  dimensions?: Partial<Record<typeof VALID_DIMENSIONS[number], number>>
  comment?: string
  evaluator_role?: EvaluatorRole
}

function isInt1to5(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5
}

// ─── POST — cria um feedback ──────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id: messageId } = await params

  // Ownership: a mensagem tem que pertencer a uma conversa do user.
  // Também precisa ser do assistant — feedback em mensagem do user não faz sentido.
  const [row] = await db
    .select({
      id: messages.id,
      role: messages.role,
      councilMode: messages.councilMode,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(
      eq(messages.id, messageId),
      eq(conversations.userId, session.user.id),
    ))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
  }

  if (row.role !== 'assistant') {
    return NextResponse.json(
      { error: 'Feedback só é aceito em respostas do assistant' },
      { status: 400 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as FeedbackBody

  // Validação ──────────────────────────────────────────────────────────────
  if (body.thumbs !== undefined && !(VALID_THUMBS as readonly string[]).includes(body.thumbs)) {
    return NextResponse.json({ error: 'thumbs inválido (deve ser up ou down)' }, { status: 400 })
  }

  if (body.rating !== undefined && !isInt1to5(body.rating)) {
    return NextResponse.json({ error: 'rating deve ser inteiro 1-5' }, { status: 400 })
  }

  if (body.evaluator_role !== undefined
      && !(VALID_ROLES as readonly string[]).includes(body.evaluator_role)) {
    return NextResponse.json({ error: 'evaluator_role inválido' }, { status: 400 })
  }

  if (body.dimensions !== undefined) {
    if (typeof body.dimensions !== 'object' || body.dimensions === null) {
      return NextResponse.json({ error: 'dimensions deve ser objeto' }, { status: 400 })
    }
    for (const k of VALID_DIMENSIONS) {
      const v = body.dimensions[k]
      if (v !== undefined && !isInt1to5(v)) {
        return NextResponse.json(
          { error: `dimensions.${k} deve ser inteiro 1-5` },
          { status: 400 },
        )
      }
    }
  }

  if (body.comment !== undefined && typeof body.comment !== 'string') {
    return NextResponse.json({ error: 'comment deve ser string' }, { status: 400 })
  }

  // Exige pelo menos um sinal de avaliação — feedback vazio polui a análise.
  if (body.thumbs === undefined && body.rating === undefined) {
    return NextResponse.json(
      { error: 'Envie ao menos thumbs ou rating' },
      { status: 400 },
    )
  }

  // Insert ─────────────────────────────────────────────────────────────────
  const [inserted] = await db
    .insert(messageFeedbacks)
    .values({
      messageId,
      userId: session.user.id,
      thumbs: body.thumbs ?? null,
      rating: body.rating ?? null,
      dimensions: body.dimensions ?? null,
      comment: body.comment?.trim() || null,
      evaluatorRole: body.evaluator_role ?? 'founder',
    })
    .returning()

  return NextResponse.json({
    ...serializeMessageFeedback(inserted),
    // Devolve o modo da mensagem pra UI poder cruzar imediatamente — útil
    // quando o widget de feedback quer mostrar "você avaliou uma resposta modo X".
    message_council_mode: row.councilMode ?? null,
  })
}

// ─── GET — lista os feedbacks da mensagem (útil pra UI e análise) ────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUserSession(req)
  if (!session) return response

  const { id: messageId } = await params

  // Mesma checagem de ownership do POST
  const [row] = await db
    .select({ id: messages.id })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(
      eq(messages.id, messageId),
      eq(conversations.userId, session.user.id),
    ))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
  }

  const feedbacks = await db
    .select()
    .from(messageFeedbacks)
    .where(eq(messageFeedbacks.messageId, messageId))
    .orderBy(asc(messageFeedbacks.createdAt))

  return NextResponse.json(feedbacks.map(serializeMessageFeedback))
}
