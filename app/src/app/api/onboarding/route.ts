export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getCompanyForUser,
  getCurrentSession,
  markOnboardingCompleted,
  upsertCompanyForUser,
} from '@/lib/auth/server'
import Anthropic from '@anthropic-ai/sdk'

export interface OnboardingPayload {
  company_name: string
  industry: string
  team_size: string
  founded_period: string
  capital_stage: string
  business_type: string
  business_model: string
  monetization: string
  product_description: string
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
  icp_defined: boolean
  icp_description?: string
  acquisition_channel: string
  main_bottleneck: string
  main_bottleneck_detail?: string
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

function buildFallbackDiagnosis(data: OnboardingPayload): DiagnosisResult {
  return {
    stage: data.active_customers && data.active_customers > 20 ? 'early_traction' : 'pre_revenue',
    stage_reason: 'Diagnóstico local determinístico usado para desenvolvimento e testes automatizados.',
    diagnostic_summary: `A empresa ${data.company_name} já tem clareza inicial de proposta e precisa transformar o onboarding em hipóteses acionáveis no board.`,
    priority_ladder: [
      {
        rank: 1,
        problem: 'Validar proposta central',
        detail: 'Consolidar a mensagem do produto e testar a dor principal com ICP claro.',
        framework: 'Problem-Solution Fit',
        urgency: 'critical',
      },
      {
        rank: 2,
        problem: 'Definir aquisição dominante',
        detail: `Dobrar a aposta no canal ${data.acquisition_channel} até provar tração repetível.`,
        framework: 'Bullseye Framework',
        urgency: 'high',
      },
      {
        rank: 3,
        problem: 'Organizar prioridades',
        detail: `O gargalo ${data.main_bottleneck} precisa virar plano explícito de execução no board.`,
        framework: 'ICE Prioritization',
        urgency: 'medium',
      },
    ],
  }
}

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
  if (d.marketplace_weak_side) lines.push(`Lado mais fraco: ${d.marketplace_weak_side}`)
  return lines.length ? lines.join('\n') : 'Métricas não informadas'
}

async function runDiagnosis(data: OnboardingPayload): Promise<DiagnosisResult> {
  if (process.env.CURIA_FAKE_DIAGNOSIS === '1') {
    return buildFallbackDiagnosis(data)
  }

  if (!process.env.ANTHROPIC_API_KEY && process.env.NODE_ENV !== 'production') {
    return buildFallbackDiagnosis(data)
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Você é o sistema de diagnóstico da Curia — um board estratégico de IA para founders.

Analise os dados abaixo e retorne um diagnóstico estratégico em JSON.

## Dados da empresa

Empresa: ${data.company_name}
Setor: ${data.industry}
Tipo de negócio: ${data.business_type} | ${data.business_model}
Monetização: ${data.monetization}
Ticket médio: ${data.average_ticket ? `R$${data.average_ticket}` : 'Não informado'}
Produto/Serviço: ${data.product_description}
Time: ${data.team_size} pessoas
Fundada: ${data.founded_period}
Capital: ${data.capital_stage}

## Métricas

${buildMetricsBlock(data)}

## Tração

Clientes ativos: ${data.active_customers ?? 'Não informado'}
ICP definido: ${data.icp_defined ? `Sim — ${data.icp_description}` : 'Não'}
Canal principal de aquisição: ${data.acquisition_channel}

## Gargalo principal

${data.main_bottleneck}${data.main_bottleneck_detail ? ` — ${data.main_bottleneck_detail}` : ''}

## Instruções

Retorne APENAS um JSON válido com a estrutura abaixo. Sem markdown, sem texto antes ou depois.

{
  "stage": "pre_revenue | early_traction | growth | scale",
  "stage_reason": "1-2 frases explicando por que esse estágio, com base nos dados",
  "diagnostic_summary": "Parágrafo de 3-4 linhas: o que está bem, o que é crítico, qual deve ser o foco imediato",
  "priority_ladder": [
    {
      "rank": 1,
      "problem": "Nome do problema em até 8 palavras",
      "detail": "1-2 linhas explicando o problema específico desta empresa com base nos dados",
      "framework": "Framework ou metodologia mais indicada para resolver este problema",
      "urgency": "critical | high | medium"
    }
  ]
}

Regras:
- Gere entre 3 e 5 itens na priority_ladder, do mais crítico ao menos urgente
- Seja específico para esta empresa — nunca genérico
- Os frameworks devem ser práticos e adequados ao estágio e modelo de negócio
- Se não houver dados financeiros, use o que foi informado para inferir a situação`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (response.content[0] as { type: string; text: string }).text.trim()
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(text) as DiagnosisResult
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const company = await getCompanyForUser(session.user.id)
  return NextResponse.json({ company })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: OnboardingPayload = await req.json()
    const diagnosis = await runDiagnosis(body)

    const company = await upsertCompanyForUser(session.user.id, {
      companyName: body.company_name,
      industry: body.industry,
      teamSize: body.team_size,
      foundedPeriod: body.founded_period,
      capitalStage: body.capital_stage,
      businessType: body.business_type,
      businessModel: body.business_model,
      monetization: body.monetization,
      averageTicket: body.average_ticket?.toString() ?? null,
      productDescription: body.product_description,
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
      icpDefined: body.icp_defined,
      icpDescription: body.icp_description ?? null,
      acquisitionChannel: body.acquisition_channel,
      mainBottleneck: body.main_bottleneck,
      mainBottleneckDetail: body.main_bottleneck_detail ?? null,
      diagnosedStage: diagnosis.stage,
      stageConfirmed: false,
      diagnosticSummary: diagnosis.diagnostic_summary,
      priorityLadder: diagnosis.priority_ladder,
      onboardingCompletedAt: new Date(),
    })

    const user = await markOnboardingCompleted(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'Unable to update user.' }, { status: 500 })
    }
    const response = NextResponse.json({
      company_id: company.id,
      stage: diagnosis.stage,
      stage_reason: diagnosis.stage_reason,
      diagnostic_summary: diagnosis.diagnostic_summary,
      priority_ladder: diagnosis.priority_ladder,
    })
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/onboarding]', msg, err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
