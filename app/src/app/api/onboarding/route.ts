export const maxDuration = 300
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db/client'
import { conversations, messages } from '@/db/schema'
import {
  getCompanyForUser,
  getCurrentSession,
  markOnboardingCompleted,
  upsertCompanyForUser,
} from '@/lib/auth/server'
import { serializeCompany } from '@/lib/db/serializers'
import { buildSystemPrompt } from '@/lib/llm/board-prompt'
import type { CompanyContext } from '@/types'

// ─── Payload (v2) ─────────────────────────────────────────────────────────────
// Os campos legados (icp_defined, acquisition_channel, team_size, founded_period,
// capital_stage, business_model, monetization, main_bottleneck[, _detail]) foram
// removidos do formulário e não são mais esperados aqui — mas continuam nullable
// no banco. Se vier algum, é ignorado silenciosamente.

export interface OnboardingPayload {
  // Bloco 1 — abertura
  company_name: string
  industry: string
  business_type: string
  product_description: string          // a frase "pra avó"
  // Bloco 2 — narrativa
  ideal_customer_story: string
  why_they_paid: string
  current_moment: string               // chip value
  // Bloco 3 — números (condicional por tipo, todos opcionais)
  average_ticket?: number
  mrr?: number
  churn_rate?: number
  cac?: number
  ltv?: number
  monthly_revenue?: number
  gross_margin?: number
  max_capacity?: number
  gmv?: number
  take_rate?: number
  marketplace_weak_side?: string
  active_customers?: number
  // Bloco 4 — tensão
  keeping_up_at_night: string
  current_hypothesis: string
  what_tried: string
  pending_decision: string
}

function normalizePayload(body: Partial<OnboardingPayload>): OnboardingPayload {
  return {
    company_name: body.company_name ?? '',
    industry: body.industry ?? '',
    business_type: body.business_type ?? '',
    product_description: body.product_description ?? '',
    ideal_customer_story: body.ideal_customer_story ?? '',
    why_they_paid: body.why_they_paid ?? '',
    current_moment: body.current_moment ?? '',
    average_ticket: body.average_ticket,
    mrr: body.mrr,
    churn_rate: body.churn_rate,
    cac: body.cac,
    ltv: body.ltv,
    monthly_revenue: body.monthly_revenue,
    gross_margin: body.gross_margin,
    max_capacity: body.max_capacity,
    gmv: body.gmv,
    take_rate: body.take_rate,
    marketplace_weak_side: body.marketplace_weak_side ?? '',
    active_customers: body.active_customers,
    keeping_up_at_night: body.keeping_up_at_night ?? '',
    current_hypothesis: body.current_hypothesis ?? '',
    what_tried: body.what_tried ?? '',
    pending_decision: body.pending_decision ?? '',
  }
}

interface PriorityItem {
  rank: number
  problem: string
  detail: string
  framework: string
  urgency: 'critical' | 'high' | 'medium'
}

interface DiagnosisResult {
  stage: string
  stage_reason: string
  diagnostic_summary: string
  priority_ladder: PriorityItem[]
}

// ─── Helpers de prompt ────────────────────────────────────────────────────────

function buildMetricsBlock(d: OnboardingPayload): string {
  const lines: string[] = []
  if (d.mrr !== undefined) lines.push(`MRR: R$${d.mrr}`)
  if (d.churn_rate !== undefined) lines.push(`Churn mensal: ${d.churn_rate}%`)
  if (d.cac !== undefined) lines.push(`CAC: R$${d.cac}`)
  if (d.ltv !== undefined) lines.push(`LTV: R$${d.ltv}`)
  if (d.monthly_revenue !== undefined) lines.push(`Faturamento mensal: R$${d.monthly_revenue}`)
  if (d.gross_margin !== undefined) lines.push(`Margem bruta: ${d.gross_margin}%`)
  if (d.max_capacity !== undefined) lines.push(`Capacidade máxima/mês: ${d.max_capacity}`)
  if (d.gmv !== undefined) lines.push(`GMV mensal: R$${d.gmv}`)
  if (d.take_rate !== undefined) lines.push(`Take rate: ${d.take_rate}%`)
  if (d.marketplace_weak_side) lines.push(`Lado mais fraco do marketplace: ${d.marketplace_weak_side}`)
  if (d.active_customers !== undefined) lines.push(`Clientes ativos: ${d.active_customers}`)
  if (d.average_ticket !== undefined) lines.push(`Ticket médio: R$${d.average_ticket}`)
  return lines.length ? lines.join('\n') : 'Métricas não informadas (founder preferiu não chutar — respeitar isso)'
}

function buildOnboardingNarrativeBlock(d: OnboardingPayload): string {
  return `## Identificação

Empresa: ${d.company_name}
Setor: ${d.industry}
Tipo de negócio: ${d.business_type}
O que a empresa faz (frase "pra avó"): ${d.product_description}

## Narrativa do founder

Cliente real que entrou recentemente:
${d.ideal_customer_story}

Por que essa pessoa pagou (nas palavras do founder):
${d.why_they_paid}

Momento da empresa (autoavaliação do founder):
${d.current_moment}

## Números

${buildMetricsBlock(d)}

## Tensão atual

O que está tirando o sono do founder:
${d.keeping_up_at_night}

Hipótese atual do founder para a causa disso:
${d.current_hypothesis}

O que já tentou (e por que não funcionou o suficiente):
${d.what_tried}

Decisão que o founder precisa tomar nas próximas 2 semanas:
${d.pending_decision}`
}

// ─── Fallbacks determinísticos (dev / testes) ─────────────────────────────────

function buildFallbackBriefing(d: OnboardingPayload): string {
  return [
    `A ${d.company_name} é uma empresa de ${d.industry} no formato ${d.business_type}, cuja proposta é "${d.product_description}".`,
    `O founder descreve o momento atual como "${d.current_moment}".`,
    `O sintoma principal que está incomodando: ${d.keeping_up_at_night}.`,
    `A hipótese do founder para a causa: ${d.current_hypothesis}.`,
    `Já tentaram: ${d.what_tried}.`,
    `Decisão pendente nas próximas 2 semanas: ${d.pending_decision}.`,
  ].join(' ')
}

function buildFallbackDiagnosis(d: OnboardingPayload): DiagnosisResult {
  return {
    stage: d.active_customers && d.active_customers > 20 ? 'early_traction' : 'pre_revenue',
    stage_reason: 'Diagnóstico local determinístico usado para desenvolvimento e testes automatizados.',
    diagnostic_summary: `${d.company_name} — sintoma principal: ${d.keeping_up_at_night}. Hipótese do founder: ${d.current_hypothesis}.`,
    priority_ladder: [
      {
        rank: 1,
        problem: 'Validar proposta central',
        detail: 'Consolidar a mensagem do produto e testar a dor principal com cliente real.',
        framework: 'Problem-Solution Fit',
        urgency: 'critical',
      },
      {
        rank: 2,
        problem: 'Fechar a decisão pendente',
        detail: `Destravar: ${d.pending_decision}.`,
        framework: 'Eisenhower Matrix',
        urgency: 'high',
      },
      {
        rank: 3,
        problem: 'Endereçar a hipótese do founder',
        detail: `Testar se a hipótese "${d.current_hypothesis}" realmente explica o sintoma.`,
        framework: 'Root Cause Analysis',
        urgency: 'medium',
      },
    ],
  }
}

function buildFallbackFirstMessage(firstName: string | null, d: OnboardingPayload): string {
  const name = firstName ? `${firstName}, ` : ''
  return `${name}li tudo. Antes de mais nada, três coisas me chamaram atenção no que você contou:

1. O sintoma que você descreveu ("${d.keeping_up_at_night.slice(0, 140)}${d.keeping_up_at_night.length > 140 ? '…' : ''}") e a hipótese que você tem pra ele parecem estar em pontos diferentes — vale a pena destrinchar onde elas se encontram e onde não se encontram.

2. O que você já tentou me diz muito sobre como você pensa sob pressão — mas o fato de não ter funcionado o suficiente sugere que pode haver uma camada abaixo que a gente ainda não nomeou.

3. A decisão que você precisa tomar nas próximas 2 semanas ("${d.pending_decision.slice(0, 140)}${d.pending_decision.length > 140 ? '…' : ''}") não é uma decisão isolada — ela provavelmente acelera ou trava tudo que vem depois.

Qual dessas três você quer começar a destrinchar? Ou tem outra coisa que eu não vi e você quer trazer antes?`
}

// ─── LLM calls ────────────────────────────────────────────────────────────────

function useFallback(): boolean {
  if (process.env.CURIA_FAKE_DIAGNOSIS === '1') return true
  if (!process.env.ANTHROPIC_API_KEY && process.env.NODE_ENV !== 'production') return true
  return false
}

async function generateBriefing(client: Anthropic, d: OnboardingPayload): Promise<string> {
  const narrative = buildOnboardingNarrativeBlock(d)

  const prompt = `Você é a Curia — um board estratégico de IA para founders. Acabou de receber o briefing inicial abaixo, escrito pelo próprio founder durante o onboarding.

Sua tarefa: escrever um MEMO INTERNO de 6 a 10 linhas em português, em prosa contínua (sem bullets, sem títulos), que sintetize o contexto da empresa para ser usado como memória compartilhada de todo agente do board dali pra frente.

O memo deve conter, nessa ordem aproximada:
1. O que a empresa é (nome, setor, tipo, uma frase sobre o produto).
2. Quem é o cliente real descrito pelo founder e por que pagaram.
3. O momento autoavaliado pelo founder.
4. Números relevantes se houver.
5. O sintoma principal (o que está tirando o sono).
6. A hipótese atual do founder para a causa.
7. O que já foi tentado.
8. A decisão pendente nas próximas 2 semanas.

Regras críticas:
- Seja denso e factual. Nada de floreio.
- Use o nome da empresa no início.
- Preserve as palavras do founder quando ele usou termos específicos (ex: se ele escreveu "tá travando", não traduza para "há um gargalo").
- Não interprete, não opine, não sugira ainda — esse memo é só sinal bruto para o board trabalhar depois.
- Saída: apenas o parágrafo. Sem markdown, sem aspas, sem prefixo tipo "Memo:".

---

${narrative}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as { type: string; text: string }).text.trim()
  return text
}

async function generateDiagnosis(client: Anthropic, d: OnboardingPayload): Promise<DiagnosisResult> {
  const narrative = buildOnboardingNarrativeBlock(d)

  const prompt = `Você é o sistema de diagnóstico estratégico da Curia.

Analise o briefing abaixo e retorne um diagnóstico estratégico em JSON.

---

${narrative}

---

Retorne APENAS um JSON válido com a estrutura abaixo. Sem markdown, sem texto antes ou depois.

{
  "stage": "pre_revenue | early_traction | growth | scale",
  "stage_reason": "1-2 frases explicando por que esse estágio, com base nos dados e na narrativa do founder",
  "diagnostic_summary": "Parágrafo de 3-4 linhas: o que está bem, o que é crítico, qual deve ser o foco imediato. Seja específico ao que o founder contou — nunca genérico.",
  "priority_ladder": [
    {
      "rank": 1,
      "problem": "Nome do problema em até 8 palavras",
      "detail": "1-2 linhas descrevendo o problema desta empresa, usando algo que o founder disse",
      "framework": "Framework ou metodologia mais indicada",
      "urgency": "critical | high | medium"
    }
  ]
}

Regras:
- Gere entre 3 e 5 itens na priority_ladder, do mais crítico ao menos urgente.
- Priorize problemas que conversam com a hipótese do founder, com o que já foi tentado e com a decisão pendente.
- Se a hipótese do founder parecer estar deslocada do sintoma que ele descreveu, isso é sinal importante — reflita na ladder.
- Os frameworks devem ser práticos e adequados ao estágio e modelo de negócio.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (response.content[0] as { type: string; text: string }).text.trim()
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(text) as DiagnosisResult
}

async function generateFirstBoardMessage(
  client: Anthropic,
  companyContext: CompanyContext,
  firstName: string | null,
): Promise<string> {
  const system = buildSystemPrompt(companyContext)
  const namePart = firstName ? `Eu me chamo ${firstName}.` : ''

  const userTurn = `${namePart} Acabei de terminar o onboarding do board — você leu tudo no briefing que eu te passei.

Antes de qualquer outra coisa: me dá sua leitura inicial. Nada de análise longa, nada de enumerar frameworks. Quero saber três coisas específicas que te chamaram atenção no que eu contei — tensões entre o sintoma e a hipótese, entre a hipótese e o que já tentei, ou qualquer coisa que você acha que eu não enxerguei. No fim, pergunta qual delas eu quero destrinchar primeiro. Fala comigo como um conselheiro sênior falaria no primeiro aperto de mão, não como um robô fazendo onboarding.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system,
    messages: [{ role: 'user', content: userTurn }],
  })

  const text = (response.content[0] as { type: string; text: string }).text.trim()
  return text
}

// ─── GET — pré-popular onboarding com dados existentes ────────────────────────

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const company = await getCompanyForUser(session.user.id)
  return NextResponse.json({ company })
}

// ─── POST — fluxo v2 em 5 etapas ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await req.json() as Partial<OnboardingPayload>
    const body = normalizePayload(rawBody)

    // ── Etapa 1: persistir o que o founder respondeu ──────────────────────────
    await upsertCompanyForUser(session.user.id, {
      companyName: body.company_name,
      industry: body.industry,
      businessType: body.business_type,
      productDescription: body.product_description,
      idealCustomerStory: body.ideal_customer_story,
      whyTheyPaid: body.why_they_paid,
      currentMoment: body.current_moment,
      averageTicket: body.average_ticket?.toString() ?? null,
      mrr: body.mrr?.toString() ?? null,
      churnRate: body.churn_rate?.toString() ?? null,
      cac: body.cac?.toString() ?? null,
      ltv: body.ltv?.toString() ?? null,
      monthlyRevenue: body.monthly_revenue?.toString() ?? null,
      grossMargin: body.gross_margin?.toString() ?? null,
      maxCapacity: body.max_capacity ?? null,
      gmv: body.gmv?.toString() ?? null,
      takeRate: body.take_rate?.toString() ?? null,
      marketplaceWeakSide: body.marketplace_weak_side ?? null,
      activeCustomers: body.active_customers ?? null,
      keepingUpAtNight: body.keeping_up_at_night,
      currentHypothesis: body.current_hypothesis,
      whatTried: body.what_tried,
      pendingDecision: body.pending_decision,
    })

    // ── Etapa 2: gerar briefing_memo + priority_ladder em paralelo ────────────
    let briefingMemo: string
    let diagnosis: DiagnosisResult

    if (useFallback()) {
      briefingMemo = buildFallbackBriefing(body)
      diagnosis = buildFallbackDiagnosis(body)
    } else {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const [bm, dx] = await Promise.all([
        generateBriefing(client, body),
        generateDiagnosis(client, body),
      ])
      briefingMemo = bm
      diagnosis = dx
    }

    // ── Etapa 3: atualizar company com o briefing + diagnosis + stage ─────────
    const companyRow = await upsertCompanyForUser(session.user.id, {
      briefingMemo,
      diagnosedStage: diagnosis.stage,
      stageConfirmed: false,
      diagnosticSummary: diagnosis.diagnostic_summary,
      priorityLadder: diagnosis.priority_ladder,
      onboardingCompletedAt: new Date(),
    })

    // ── Etapa 4: criar conversation e gerar primeira fala do board ────────────
    const [conversation] = await db
      .insert(conversations)
      .values({
        userId: session.user.id,
        companyId: companyRow.id,
        title: 'Primeira leitura do board',
        conversationType: 'regular',
      })
      .returning()

    const serialized = serializeCompany(companyRow)
    const companyContext: CompanyContext = {
      company_name: serialized.company_name,
      industry: serialized.industry ?? undefined,
      business_type: serialized.business_type ?? undefined,
      business_model: serialized.business_model ?? undefined,
      monetization: serialized.monetization ?? undefined,
      product_description: serialized.product_description ?? undefined,
      average_ticket: serialized.average_ticket ?? undefined,
      employees: serialized.team_size ?? undefined,
      founded_period: serialized.founded_period ?? undefined,
      capital_stage: serialized.capital_stage ?? undefined,
      mrr: serialized.mrr ?? undefined,
      churn_rate: serialized.churn_rate ?? undefined,
      cac: serialized.cac ?? undefined,
      ltv: serialized.ltv ?? undefined,
      monthly_revenue: serialized.monthly_revenue ?? undefined,
      gross_margin: serialized.gross_margin ?? undefined,
      max_capacity: serialized.max_capacity ?? undefined,
      gmv: serialized.gmv ?? undefined,
      take_rate: serialized.take_rate ?? undefined,
      marketplace_weak_side: serialized.marketplace_weak_side ?? undefined,
      active_customers: serialized.active_customers ?? undefined,
      icp_defined: serialized.icp_defined,
      icp_description: serialized.icp_description ?? undefined,
      acquisition_channel: serialized.acquisition_channel ?? undefined,
      main_bottleneck: serialized.main_bottleneck ?? undefined,
      main_bottleneck_detail: serialized.main_bottleneck_detail ?? undefined,
      ideal_customer_story: serialized.ideal_customer_story ?? undefined,
      why_they_paid: serialized.why_they_paid ?? undefined,
      current_moment: serialized.current_moment ?? undefined,
      keeping_up_at_night: serialized.keeping_up_at_night ?? undefined,
      current_hypothesis: serialized.current_hypothesis ?? undefined,
      what_tried: serialized.what_tried ?? undefined,
      pending_decision: serialized.pending_decision ?? undefined,
      briefing_memo: serialized.briefing_memo ?? undefined,
      diagnosed_stage: serialized.diagnosed_stage ?? undefined,
      diagnostic_summary: serialized.diagnostic_summary ?? undefined,
      priority_ladder: serialized.priority_ladder as CompanyContext['priority_ladder'],
    }

    const firstName = session.user.fullName?.trim().split(/\s+/)[0] ?? null

    let firstBoardMessage: string
    if (useFallback()) {
      firstBoardMessage = buildFallbackFirstMessage(firstName, body)
    } else {
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        firstBoardMessage = await generateFirstBoardMessage(client, companyContext, firstName)
      } catch (error) {
        // Se a primeira chamada falhar, caímos no fallback determinístico pra não
        // travar o handoff — o founder recebe uma fala razoável e pode seguir.
        console.error('[onboarding] first message failed, using fallback:', error)
        firstBoardMessage = buildFallbackFirstMessage(firstName, body)
      }
    }

    await db.insert(messages).values({
      conversationId: conversation.id,
      role: 'assistant',
      content: firstBoardMessage,
    })

    // ── Etapa 5: marcar onboarding como concluído ─────────────────────────────
    await markOnboardingCompleted(session.user.id)

    return NextResponse.json({
      conversation_id: conversation.id,
      diagnosis,
    })
  } catch (error) {
    console.error('[onboarding] failed:', error)
    const message = error instanceof Error ? error.message : 'Erro ao preparar o board.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}