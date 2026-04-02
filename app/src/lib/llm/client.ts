import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { queryLoop } from './query-loop'
import type { QueryEvent } from './query-loop'

// ─── Re-exports para compatibilidade ─────────────────────────────────────────

export type { QueryEvent }
export type { TerminalReason } from './query-loop'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  system: string
  messages: LLMMessage[]
  signal?: AbortSignal
}

// ─── Clients ──────────────────────────────────────────────────────────────────

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey })
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

// ─── Stream de eventos NDJSON ─────────────────────────────────────────────────
// Cada linha do stream é um JSON serializado de QueryEvent.
// O frontend parseia linha a linha para atualizar o estado.

export function streamBoardEvents(options: LLMOptions): ReadableStream<string> {
  const openai = getOpenAIClient()
  const anthropic = getAnthropicClient()

  const loop = queryLoop({
    system: options.system,
    messages: options.messages,
    openai,
    anthropic,
    signal: options.signal,
  })

  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const event of loop) {
          controller.enqueue(JSON.stringify(event) + '\n')
        }
      } catch (err) {
        const errEvent: QueryEvent = {
          type: 'error',
          code: 'stream_error',
          message: String(err),
        }
        controller.enqueue(JSON.stringify(errEvent) + '\n')
        const doneEvent: QueryEvent = {
          type: 'done',
          reason: 'model_error',
          strategyProposal: null,
        }
        controller.enqueue(JSON.stringify(doneEvent) + '\n')
      } finally {
        controller.close()
      }
    },
  })
}

// ─── Title generation (Haiku — rápido, sem streaming) ────────────────────────

export async function generateConversationTitle(firstMessage: string): Promise<string> {
  const client = getAnthropicClient()
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 24,
      system:
        'Gere um título conciso (3 a 6 palavras) em português para uma conversa estratégica que começa com a mensagem do usuário. Retorne APENAS o título — sem aspas, sem ponto final, sem explicação.',
      messages: [{ role: 'user', content: firstMessage.slice(0, 400) }],
    })
    const text = (response.content[0] as { type: string; text: string }).text?.trim()
    return text || firstMessage.slice(0, 50)
  } catch {
    return firstMessage.slice(0, 50)
  }
}

// ─── Compatibilidade: STRATEGY_PROPOSAL_MARKER ───────────────────────────────
// Mantido para não quebrar imports existentes. Com NDJSON, não é mais usado.

export const STRATEGY_PROPOSAL_MARKER = '\n[STRATEGY_PROPOSAL]:'
