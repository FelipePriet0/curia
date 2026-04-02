// ─── Counselors — executor paralelo estilo Agentfriend ───────────────────────
// Cada conselheiro é uma "read-only Tool": roda em paralelo com Haiku,
// produz um brief focado no seu domínio, e emite eventos de progresso.
// O loop de síntese recebe todos os briefs como contexto autoritativo.

import Anthropic from '@anthropic-ai/sdk'
import type { QueryEvent } from './query-loop'

// ─── Definições dos conselheiros ──────────────────────────────────────────────

interface CounselorDef {
  id: string
  label: string
  systemPrompt: string
}

const COUNSELOR_DEFS: CounselorDef[] = [
  {
    id: 'strategy',
    label: 'Estratégia',
    systemPrompt: `Você é o Conselheiro de Estratégia do Curia Board.
Diagnóstico estratégico: identifique o problema central, o estágio da empresa (0-4) e o framework mais relevante (Rumelt, Collins, Porter, Thiel, etc.).
Responda em 2-3 frases diretas em português. Sem introdução, sem saudação. Foque no que é estrategicamente crítico.`,
  },
  {
    id: 'finance',
    label: 'Finanças',
    systemPrompt: `Você é o Conselheiro de Finanças do Curia Board.
Avalie saúde financeira: unit economics, LTV/CAC, margens, fluxo de caixa, concentração de receita, riscos de capital.
Responda em 2-3 frases diretas em português. Sem introdução. Aponte o risco ou oportunidade financeira mais crítica.`,
  },
  {
    id: 'growth',
    label: 'Growth',
    systemPrompt: `Você é o Conselheiro de Growth do Curia Board.
Avalie PMF, canais de aquisição, retenção, loops de crescimento e métricas-chave (North Star, coortes, Aha Moment).
Responda em 2-3 frases diretas em português. Sem introdução. Foque no que bloqueia ou acelera o crescimento.`,
  },
  {
    id: 'product',
    label: 'Produto',
    systemPrompt: `Você é o Conselheiro de Produto do Curia Board.
Avalie product-market fit, jobs-to-be-done, aha moment, decisões de roadmap e diferenciação do produto.
Responda em 2-3 frases diretas em português. Sem introdução. Identifique a principal lacuna ou força do produto.`,
  },
  {
    id: 'operations',
    label: 'Operações',
    systemPrompt: `Você é o Conselheiro de Operações do Curia Board.
Identifique gargalos de execução, processos críticos, problemas de time e restrições sistêmicas (Teoria das Restrições).
Responda em 2-3 frases diretas em português. Sem introdução. Aponte o principal gargalo operacional.`,
  },
  {
    id: 'brand',
    label: 'Marca',
    systemPrompt: `Você é o Conselheiro de Marca do Curia Board.
Avalie posicionamento de marca, clareza da mensagem, percepção do cliente e diferenciação comunicada.
Responda em 2-3 frases diretas em português. Sem introdução. Identifique o maior risco ou oportunidade de posicionamento.`,
  },
]

// ─── Fila assíncrona — permite yield de eventos de operações paralelas ────────
// Padrão do Agentfriend: StreamingToolExecutor usa fila interna para
// coletar resultados de tools paralelas e emiti-los ordenados ao generator.

class AsyncQueue<T> {
  private items: T[] = []
  private waiters: Array<(v: T) => void> = []

  push(item: T) {
    const waiter = this.waiters.shift()
    if (waiter) waiter(item)
    else this.items.push(item)
  }

  async pop(): Promise<T> {
    if (this.items.length > 0) return this.items.shift()!
    return new Promise((resolve) => this.waiters.push(resolve))
  }
}

// ─── Execução de um conselheiro individual (Haiku — rápido, focado) ───────────

async function runCounselor(
  def: CounselorDef,
  question: string,
  recentContext: string,
  anthropic: Anthropic,
): Promise<string> {
  const userContent = recentContext
    ? `Contexto da conversa:\n${recentContext}\n\nÚltima questão: ${question}`
    : question

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: def.systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  return (response.content[0] as { type: string; text: string }).text?.trim() ?? ''
}

// ─── Executor paralelo — todos os conselheiros rodam concorrentemente ─────────
// Emite events de progresso conforme cada conselheiro inicia e conclui.
// Após todos completarem, retorna os briefs para o loop de síntese.

export type CounselorBriefs = Map<string, string>

export async function* runCounselorPhase(
  question: string,
  recentContext: string,
  anthropic: Anthropic,
): AsyncGenerator<QueryEvent, CounselorBriefs> {
  const queue = new AsyncQueue<QueryEvent | null>()
  const briefs: CounselorBriefs = new Map()
  let pending = COUNSELOR_DEFS.length

  // Disparar todos os conselheiros sem aguardar (paralelo real)
  for (const def of COUNSELOR_DEFS) {
    ;(async () => {
      queue.push({ type: 'counselor_start', counselorId: def.id })
      try {
        const brief = await runCounselor(def, question, recentContext, anthropic)
        briefs.set(def.id, brief)
        queue.push({ type: 'counselor_end', counselorId: def.id, brief })
      } catch {
        briefs.set(def.id, '')
        queue.push({ type: 'counselor_end', counselorId: def.id, brief: '' })
      } finally {
        pending--
        if (pending === 0) queue.push(null)  // sinal de conclusão
      }
    })()
  }

  // Drenar eventos conforme chegam (padrão getRemainingResults do Agentfriend)
  while (true) {
    const event = await queue.pop()
    if (event === null) return briefs
    yield event
  }
}

// ─── Construir bloco de contexto para o loop de síntese ──────────────────────

export function buildCounselorContext(briefs: CounselorBriefs): string {
  const lines = COUNSELOR_DEFS
    .filter((d) => briefs.get(d.id))
    .map((d) => `**${d.label}:** ${briefs.get(d.id)}`)
    .join('\n')

  if (!lines) return ''

  return `<deliberacao_interna_do_conselho>
Os conselheiros especializados deliberaram. Use estas perspectivas como base autoritativa para o parecer final — não as cite diretamente, mas integre o raciocínio delas.

${lines}
</deliberacao_interna_do_conselho>`
}
