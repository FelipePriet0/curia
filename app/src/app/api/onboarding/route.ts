import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  // Subscription
  mrr?: number
  churn_rate?: number
  cac?: number
  ltv?: number
  // Transactional
  monthly_revenue?: number
  gross_margin?: number
  // Service
  max_capacity?: number
  // Marketplace
  gmv?: number
  take_rate?: number
  marketplace_weak_side?: string
  // Traction
  active_customers?: number
  icp_defined: boolean
  icp_description?: string
  acquisition_channel: string
  // Bottleneck
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

// ─── Diagnosis Agent ──────────────────────────────────────────────────────────

function buildMetricsBlock(d: OnboardingPayload): string {
  const lines: string[] = []
  if (d.mrr !== undefined)               lines.push(`MRR: R$${d.mrr}`)
  if (d.churn_rate !== undefined)        lines.push(`Churn mensal: ${d.churn_rate}%`)
  if (d.cac !== undefined)               lines.push(`CAC: R$${d.cac}`)
  if (d.ltv !== undefined)               lines.push(`LTV: R$${d.ltv}`)
  if (d.monthly_revenue !== undefined)   lines.push(`Faturamento mensal: R$${d.monthly_revenue}`)
  if (d.gross_margin !== undefined)      lines.push(`Margem bruta: ${d.gross_margin}%`)
  if (d.max_capacity !== undefined)      lines.push(`Capacidade máxima/mês: ${d.max_capacity}`)
  if (d.gmv !== undefined)               lines.push(`GMV mensal: R$${d.gmv}`)
  if (d.take_rate !== undefined)         lines.push(`Take rate: ${d.take_rate}%`)
  if (d.marketplace_weak_side)           lines.push(`Lado mais fraco: ${d.marketplace_weak_side}`)
  return lines.length ? lines.join('\n') : 'Métricas não informadas'
}

async function runDiagnosis(data: OnboardingPayload): Promise<DiagnosisResult> {
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

  const text = (response.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(text) as DiagnosisResult
}

// ─── POST /api/onboarding ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: OnboardingPayload = await req.json()

    // Run agent diagnosis
    const diagnosis = await runDiagnosis(body)

    // Upsert company (unique constraint on user_id)
    const { data: company, error: upsertError } = await supabase
      .from('companies')
      .upsert(
        {
          user_id:                user.id,
          company_name:           body.company_name,
          industry:               body.industry,
          team_size:              body.team_size,
          founded_period:         body.founded_period,
          capital_stage:          body.capital_stage,
          business_type:          body.business_type,
          business_model:         body.business_model,
          monetization:           body.monetization,
          average_ticket:         body.average_ticket ?? null,
          product_description:    body.product_description,
          mrr:                    body.mrr ?? null,
          churn_rate:             body.churn_rate ?? null,
          cac:                    body.cac ?? null,
          ltv:                    body.ltv ?? null,
          monthly_revenue:        body.monthly_revenue ?? null,
          gross_margin:           body.gross_margin ?? null,
          max_capacity:           body.max_capacity ?? null,
          gmv:                    body.gmv ?? null,
          take_rate:              body.take_rate ?? null,
          marketplace_weak_side:  body.marketplace_weak_side ?? null,
          active_customers:       body.active_customers ?? null,
          icp_defined:            body.icp_defined,
          icp_description:        body.icp_description ?? null,
          acquisition_channel:    body.acquisition_channel,
          main_bottleneck:        body.main_bottleneck,
          main_bottleneck_detail: body.main_bottleneck_detail ?? null,
          diagnosed_stage:        diagnosis.stage,
          stage_confirmed:        false,
          diagnostic_summary:     diagnosis.diagnostic_summary,
          priority_ladder:        diagnosis.priority_ladder,
          onboarding_completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single()

    if (upsertError) throw upsertError

    // Mark onboarding complete in user metadata so middleware can gate access
    const admin = createAdmin()
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { onboarding_completed: true },
    })

    return NextResponse.json({
      company_id:         company.id,
      stage:              diagnosis.stage,
      stage_reason:       diagnosis.stage_reason,
      diagnostic_summary: diagnosis.diagnostic_summary,
      priority_ladder:    diagnosis.priority_ladder,
    })
  } catch (err) {
    console.error('[POST /api/onboarding]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
