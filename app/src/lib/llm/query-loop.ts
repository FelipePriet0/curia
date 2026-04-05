// ─── Query Loop — inspirado no query.ts do Agentfriend ───────────────────────
// Generator assíncrono que orquestra o loop de deliberação:
// tool calls, error recovery, micro-compact, model fallback, abort handling.

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { StrategyProposal } from '@/types'
import { runCounselorPhase, buildCounselorContext, type CounselorBriefs } from './counselors'
import { autoCompact, roughTokenEstimate } from './compact'

// ─── Tipos de evento ──────────────────────────────────────────────────────────

export type TerminalReason = 'completed' | 'model_error' | 'aborted' | 'max_turns'

export type QueryEvent =
  | { type: 'delta'; text: string }
  | { type: 'counselor_start'; counselorId: string }
  | { type: 'counselor_end'; counselorId: string; brief: string }
  | { type: 'tool_call'; name: string }
  | { type: 'tool_result'; name: string }
  | { type: 'compact'; removed: number; tokensBefore?: number; tokensAfter?: number }
  | { type: 'token_estimate'; tokens: number; budget: number }
  | { type: 'turn'; turn: number }
  | { type: 'error'; code: string; message: string }
  | { type: 'done'; reason: TerminalReason; strategyProposal?: StrategyProposal | null }

// ─── Constantes do loop ───────────────────────────────────────────────────────

const MAX_TURNS = 8
const COMPACT_THRESHOLD = 30  // mensagens no histórico antes de compactar
const COMPACT_KEEP = 16       // manter as últimas N mensagens após compactar

// ─── Micro-compact ────────────────────────────────────────────────────────────
// Trunca histórico longo antes de cada chamada à API.
// Garante que a primeira mensagem mantida seja sempre 'user' (invariante da API).

type OAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

function microCompact(messages: OAIMessage[]): { messages: OAIMessage[]; removed: number } {
  if (messages.length <= COMPACT_THRESHOLD) return { messages, removed: 0 }

  const candidate = messages.slice(-COMPACT_KEEP)
  // Encontra primeiro 'user' para não iniciar com 'assistant'
  const firstUserIdx = candidate.findIndex((m) => m.role === 'user')
  const trimmed = firstUserIdx > 0 ? candidate.slice(firstUserIdx) : candidate
  const removed = messages.length - trimmed.length

  return { messages: trimmed, removed }
}

// ─── Definições de tools ──────────────────────────────────────────────────────

// ─── Tool: search_failure_case ───────────────────────────────────────────────
// Aplica o lens do Abraham Wald / Survivorship Bias:
// busca os aviões que não voltaram — não os vencedores que todo mundo copia.
// OBRIGATÓRIO quando um risco estratégico tem precedente real.
const SEARCH_FAILURE_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_failure_case',
    description:
      'Search the web for a real failure case using the Survivorship Bias (Abraham Wald) lens. MANDATORY when a strategic risk pattern was identified. Looks for companies that failed doing exactly what seems correct here — the planes that never returned. Does NOT need to be same sector: must mirror the SAME failure pattern and company stage.',
    parameters: {
      type: 'object',
      properties: {
        search_brief: {
          type: 'string',
          description:
            'Precise description of the failure pattern to find. REQUIRED fields: (1) the specific decision or move that seemed correct, (2) the survivorship blind spot — what they could not see, (3) the company stage/size comparable to the founder\'s, (4) why this is the same PATTERN not just the same sector. Do NOT use generic sector descriptions. The more specific the brief, the sharper the case.',
        },
      },
      required: ['search_brief'],
    },
  },
}

// ─── Tool: search_success_case ────────────────────────────────────────────────
// Busca precedente de sucesso para o mesmo constraint — não necessariamente
// o mesmo setor, mas a mesma dor e o mesmo tipo de decisão.
const SEARCH_SUCCESS_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_success_case',
    description:
      'Search the web for a real success case directly relevant to the founder\'s situation. Call when a concrete precedent would genuinely reframe the path forward — NOT for general inspiration. Does NOT need to be same sector — must be same constraint, same type of decision, comparable company stage.',
    parameters: {
      type: 'object',
      properties: {
        search_brief: {
          type: 'string',
          description:
            'Precise description of what to find. REQUIRED fields: (1) the specific constraint the company solved — not "grew revenue" but WHAT was blocking them, (2) the type of decision they made, (3) the company stage/size comparable to the founder\'s, (4) what the case should prove — what belief or path should it reframe? Do NOT use Apple/Amazon/Google/Netflix unless the EXACT pattern is specified. Non-obvious cases preferred.',
        },
      },
      required: ['search_brief'],
    },
  },
}

const PROPOSE_STRATEGY_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'propose_strategy',
    description:
      'Call this at the end of a conversation that has real strategic substance — when a concrete plan, diagnosis, and next steps emerged.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Suggested strategy name. Concise, specific, includes context.' },
        brief: { type: 'string', description: 'Compact strategic summary. Max 5 sentences.' },
        stage: { type: 'string', description: 'Company stage identified (0-4)' },
      },
      required: ['name', 'brief'],
    },
  },
}

// ─── Regras de qualidade — injetadas em ambos os executors ───────────────────
// O mini aplica esse filtro DURANTE a busca.
// O modelo principal aplica de novo antes de escrever.
// Casos que não passam não chegam ao founder.

const CASE_QUALITY_RULES = `
QUALITY FILTER — apply before including any case. Non-negotiable.

✅ INCLUDE only if ALL of these are true:
1. Real, named, verifiable: company or founder must be findable by name. No anonymous examples.
2. Specific decision: not "they pivoted" — what EXACTLY did they do? Which move?
3. Clear outcome: not "it worked out eventually" — what happened, specifically?
4. Pattern precision: mirrors the SPECIFIC constraint or decision type in the brief — not just the same sector or same country.
5. Stage proximity: company size and stage must be comparable. A Series C case does NOT illustrate a bootstrapped Stage 1 problem. A 50-person startup does NOT illustrate a 2-person operation.

❌ DISQUALIFY if ANY of these apply:
- Company or founder is anonymous or unverifiable ("a startup in São Paulo once...")
- Apple, Google, Amazon, Netflix, Airbnb, Nubank — UNLESS the exact failure/success PATTERN is structurally identical (not just "they also disrupted an industry")
- Outcome is vague, ambiguous, or hedged
- The link to the brief requires more than one sentence to explain → the pattern does not match
- Pre-2000 case when a modern equivalent exists for the same pattern

If fewer than 3 cases survive this filter: return only the ones that do. Do NOT pad with weak cases. A list of 2 sharp cases beats a list of 7 mediocre ones.
`

// ─── Executor: search_failure_case (Wald / Survivorship Bias lens) ───────────
// O mini busca rápido e amplo — 5-7 casos brutos que passam o filtro de qualidade.
// O modelo principal seleciona o mais afiado, aplida o lens e contextualiza.

async function execSearchFailureCase(client: OpenAI, brief: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini-search-preview',
    messages: [
      {
        role: 'system',
        content: `You are applying the Abraham Wald / Survivorship Bias lens to business research.

The Wald insight: armies studied planes that returned from battle and reinforced where the bullet holes were. Wald saw what others missed — those areas were NOT fatal. The planes hit in other places never came back. Reinforce where there are NO bullet holes.

Applied to business: everyone studies the winners. The failures are invisible because those companies never wrote a book. You find the invisible failures — the planes that didn't return.

${CASE_QUALITY_RULES}`,
      },
      {
        role: 'user',
        content: `Apply the Survivorship Bias lens. Find 5-7 real cases where companies or founders FAILED doing exactly what looks like the right move in this situation:\n\n${brief}\n\nFor each case that passes the quality filter:\n- Company/founder name (must be verifiable)\n- What their situation looked like (specific similarity to the brief)\n- What they did (the exact move that seemed correct)\n- What they could NOT see — the hidden bullet hole (the survivorship blind spot)\n- How it ended (specific outcome)\n\nApply the quality filter strictly. Invisible failures only — cases absent from typical success literature. If fewer than 3 pass, return only those. Do not pad.`,
      },
    ],
  } as any)
  return (response.choices[0]?.message?.content as string) ?? ''
}

// ─── Executor: search_success_case ───────────────────────────────────────────
// Busca precedente real do mesmo constraint — o mini varre, o modelo sintetiza.

async function execSearchSuccessCase(client: OpenAI, brief: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini-search-preview',
    messages: [
      {
        role: 'system',
        content: `You are a business case researcher. Find real, verifiable success cases. Be factual and concise. Focus on the specific constraint or decision pattern — not general inspiration. Does NOT need to be the same sector — must be the same pain, the same type of decision.

${CASE_QUALITY_RULES}`,
      },
      {
        role: 'user',
        content: `Find 5-7 real business success cases matching this brief:\n\n${brief}\n\nFor each case that passes the quality filter:\n- Company/founder name (must be verifiable)\n- What their situation was (specific similarity to the brief)\n- What they did (the exact decision or move — not "they focused on growth")\n- What happened (specific, measurable outcome when possible)\n- One line: why this directly matches the brief constraint\n\nApply the quality filter strictly. Prioritize non-obvious cases — not the ones that appear in every business book. If fewer than 3 pass, return only those. Do not pad.`,
      },
    ],
  } as any)
  return (response.choices[0]?.message?.content as string) ?? ''
}

// ─── Parâmetros do loop ───────────────────────────────────────────────────────

export interface QueryLoopParams {
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  openai: OpenAI
  anthropic?: Anthropic
  signal?: AbortSignal
}

// ─── Loop principal ───────────────────────────────────────────────────────────
//
// Estrutura por iteração (inspirada no query.ts do Agentfriend):
//   1. Checar abort
//   2. Micro-compact se histórico longo
//   3. Stream da API (OpenAI primário, Claude fallback)
//   4. Se tool_calls → executar tools, adicionar resultados, continuar
//   5. Se finish_reason = stop → yield done e retornar
//   6. Error recovery: max_tokens → compactar + retry; outros → Claude fallback
//
export async function* queryLoop(params: QueryLoopParams): AsyncGenerator<QueryEvent> {
  const { system, openai, anthropic, signal } = params

  // Histórico de mensagens da conversa (sem system — passado separadamente)
  let history: OAIMessage[] = params.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  let strategyProposal: StrategyProposal | null = null
  let turn = 0
  let useClaude = false  // ativado quando OpenAI falha

  // ── Token estimate inicial (AppState pattern: emite estado observável cedo) ──
  const TOKEN_BUDGET = 120_000
  yield { type: 'token_estimate', tokens: roughTokenEstimate(params.messages), budget: TOKEN_BUDGET }

  // ── autoCompact: sumário real via Haiku se contexto está longo ───────────────
  // Inspirado no Playbook do Agentfriend: dispara a ~60% da janela efetiva,
  // antes do counselor phase, para que os conselheiros já recebam contexto enxuto.
  const compactResult = anthropic ? await autoCompact(params.messages, anthropic).catch(() => null) : null
  if (compactResult) {
    history = compactResult.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    yield {
      type: 'compact',
      removed: compactResult.removed,
      tokensBefore: compactResult.estimatedTokensBefore,
      tokensAfter: compactResult.estimatedTokensAfter,
    }
    yield {
      type: 'token_estimate',
      tokens: compactResult.estimatedTokensAfter,
      budget: TOKEN_BUDGET,
    }
  }

  // ── Fase dos conselheiros (paralela, antes do loop principal) ────────────────
  // Inspirado no StreamingToolExecutor do Agentfriend:
  // Read-only tools rodam em paralelo → síntese roda em série depois.
  const lastUserMsg = params.messages.filter((m) => m.role === 'user').slice(-1)[0]?.content ?? ''
  const recentContext = params.messages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Fundador' : 'Conselho'}: ${m.content.slice(0, 200)}`)
    .join('\n')

  const briefs: CounselorBriefs = new Map()
  if (anthropic) {
    for await (const event of runCounselorPhase(lastUserMsg, recentContext, anthropic)) {
      if (event.type === 'counselor_end' && event.brief) {
        briefs.set(event.counselorId, event.brief)
      }
      yield event
    }
  }

  // Injetar briefs no system prompt da síntese (não polui o histórico)
  const counselorContext = buildCounselorContext(briefs)
  const synthesisSystem = counselorContext ? `${system}\n\n${counselorContext}` : system

  while (turn < MAX_TURNS) {
    // ── 1. Abort check ────────────────────────────────────────────────────────
    if (signal?.aborted) {
      yield { type: 'done', reason: 'aborted', strategyProposal }
      return
    }

    turn++
    yield { type: 'turn', turn }

    // ── 2. Micro-compact ──────────────────────────────────────────────────────
    const { messages: compacted, removed } = microCompact(history)
    if (removed > 0) {
      history = compacted
      yield { type: 'compact', removed }
    }

    // ── 3a. Claude fallback (sem tool calls) ─────────────────────────────────
    if (useClaude && anthropic) {
      try {
        const claudeMessages = history.map((m) => ({
          role: (m as any).role as 'user' | 'assistant',
          content: (m as any).content as string,
        }))
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: synthesisSystem,
          messages: claudeMessages,
        })
        for await (const chunk of stream) {
          if (signal?.aborted) { yield { type: 'done', reason: 'aborted', strategyProposal }; return }
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            yield { type: 'delta', text: chunk.delta.text }
          }
        }
        yield { type: 'done', reason: 'completed', strategyProposal }
        return
      } catch (err) {
        yield { type: 'error', code: 'model_error', message: String(err) }
        yield { type: 'done', reason: 'model_error', strategyProposal }
        return
      }
    }

    // ── 3b. OpenAI streaming ──────────────────────────────────────────────────
    let assistantContent = ''
    const toolCallAcc: Array<{
      id: string
      type: string
      function: { name: string; arguments: string }
    }> = []
    let finishReason: string | null = null

    const allMessages: OAIMessage[] = [
      { role: 'system', content: synthesisSystem },
      ...history,
    ]

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-5.4-mini-2026-03-17',
        max_tokens: 4096,
        stream: true,
        tools: [SEARCH_FAILURE_TOOL, SEARCH_SUCCESS_TOOL, PROPOSE_STRATEGY_TOOL],
        tool_choice: 'auto',
        messages: allMessages,
      } as any)

      for await (const chunk of (stream as any)) {
        if (signal?.aborted) {
          yield { type: 'done', reason: 'aborted', strategyProposal }
          return
        }

        const delta = chunk.choices[0]?.delta
        finishReason = chunk.choices[0]?.finish_reason ?? finishReason

        if (delta?.content) {
          yield { type: 'delta', text: delta.content }
          assistantContent += delta.content
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const i = tc.index ?? 0
            if (!toolCallAcc[i]) {
              toolCallAcc[i] = { id: '', type: 'function', function: { name: '', arguments: '' } }
            }
            if (tc.id) toolCallAcc[i].id = tc.id
            if (tc.function?.name) toolCallAcc[i].function.name += tc.function.name
            if (tc.function?.arguments) toolCallAcc[i].function.arguments += tc.function.arguments
          }
        }
      }
    } catch (err: any) {
      const isContextError =
        err?.code === 'context_length_exceeded' ||
        err?.status === 400 ||
        String(err).includes('max_tokens') ||
        String(err).includes('context_length')

      if (isContextError && history.length > 8) {
        // Recovery: compactar agressivamente e tentar de novo
        yield { type: 'error', code: 'context_limit', message: 'Contexto muito longo — compactando para continuar.' }
        history = history.slice(-8)
        const firstUser = history.findIndex((m) => m.role === 'user')
        if (firstUser > 0) history = history.slice(firstUser)
        yield { type: 'compact', removed: params.messages.length - history.length }
        continue  // retry este turno
      }

      // Qualquer outro erro: ativar fallback para Claude se disponível; senão finalize
      if (anthropic) {
        console.warn('[QueryLoop] OpenAI falhou, ativando Claude fallback:', err)
        useClaude = true
        continue
      }
      yield { type: 'error', code: 'model_error', message: String(err) }
      yield { type: 'done', reason: 'model_error', strategyProposal }
      continue
    }

    // ── 4. Processar tool calls ───────────────────────────────────────────────
    if (finishReason === 'tool_calls' && toolCallAcc.length > 0) {
      history.push({
        role: 'assistant',
        content: assistantContent || null,
        tool_calls: toolCallAcc.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      } as any)

      for (const tc of toolCallAcc) {
        yield { type: 'tool_call', name: tc.function.name }

        let toolResult = ''

        if (tc.function.name === 'search_failure_case') {
          try {
            const args = JSON.parse(tc.function.arguments)
            toolResult = await execSearchFailureCase(openai, args.search_brief)
          } catch {
            toolResult = 'Failure case search unavailable.'
          }
        }

        if (tc.function.name === 'search_success_case') {
          try {
            const args = JSON.parse(tc.function.arguments)
            toolResult = await execSearchSuccessCase(openai, args.search_brief)
          } catch {
            toolResult = 'Success case search unavailable.'
          }
        }

        if (tc.function.name === 'propose_strategy') {
          try {
            strategyProposal = JSON.parse(tc.function.arguments)
          } catch {}
          toolResult = 'Strategy proposal registered. Continue your response naturally.'
        }

        history.push({ role: 'tool', tool_call_id: tc.id, content: toolResult } as any)
        yield { type: 'tool_result', name: tc.function.name }
      }

      continue  // próximo turno para processar resultados das tools
    }

    // ── 5. Terminal: sem tool calls → resposta completa ───────────────────────
    if (assistantContent) {
      history.push({ role: 'assistant', content: assistantContent })
    }
    yield { type: 'done', reason: 'completed', strategyProposal }
    return
  }

  yield { type: 'done', reason: 'max_turns', strategyProposal }
}
