// ─── Compactação — baseada no autoCompact do Agentfriend ─────────────────────
// Dois níveis (como no Playbook de Compactação):
//   microCompact  — truncação rápida, sem API call (já no query-loop)
//   autoCompact   — sumário real via Haiku; preserva contexto estratégico

import Anthropic from '@anthropic-ai/sdk'
import type { LLMMessage } from './client'

// ─── Constantes ───────────────────────────────────────────────────────────────

// Estimativa: 1 token ≈ 4 caracteres
const CHARS_PER_TOKEN = 4

// Janela efetiva do modelo de síntese: ~120k tokens (gpt-5.4-mini/claude-sonnet)
// Threshold = 60% → dispara autoCompact antes de atingir o limite
const AUTOCOMPACT_TOKEN_THRESHOLD = 72_000  // ~288k chars

// Mensagens mínimas para valer a pena compactar
const AUTOCOMPACT_MIN_MESSAGES = 16

// Manter as últimas N mensagens intactas após compact
const AUTOCOMPACT_KEEP_RECENT = 8

// ─── Estimativa de tokens ─────────────────────────────────────────────────────

export function roughTokenEstimate(messages: LLMMessage[]): number {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
  return Math.ceil(totalChars / CHARS_PER_TOKEN)
}

export function shouldAutoCompact(messages: LLMMessage[]): boolean {
  if (messages.length < AUTOCOMPACT_MIN_MESSAGES) return false
  return roughTokenEstimate(messages) >= AUTOCOMPACT_TOKEN_THRESHOLD
}

// ─── Prompt de compactação ────────────────────────────────────────────────────
// Inspirado nos prompts do Agentfriend (getCompactPrompt / getCompactUserSummaryMessage):
// preservar problema central, diagnóstico, frameworks, decisões, próximos passos.

function buildCompactPrompt(conversationText: string): string {
  return `Você é um assistente de memória estratégica. Resuma a conversa abaixo em 5-7 frases densas e precisas.

Preserve obrigatoriamente:
1. O problema central identificado
2. O diagnóstico estratégico (causa raiz, estágio da empresa)
3. Frameworks aplicados (se houve)
4. Decisões tomadas e premissas assumidas
5. Próximos passos definidos (se houver)
6. Dados quantitativos relevantes mencionados

Formato: parágrafos corridos, sem marcadores, sem introdução, sem conclusão. Apenas o resumo denso.

---
${conversationText}
---`
}

// ─── Resultado da compactação ─────────────────────────────────────────────────

export interface CompactResult {
  messages: LLMMessage[]
  summary: string
  removed: number
  estimatedTokensBefore: number
  estimatedTokensAfter: number
}

// ─── autoCompact ──────────────────────────────────────────────────────────────
// Fluxo (do Playbook):
//   1) Selecionar mensagens antigas a sumarizar
//   2) Chamar Haiku (fork de sumário — independente do modelo principal)
//   3) Criar boundary: par user/assistant com o resumo
//   4) Retornar: [boundary_pair] + [mensagens recentes]
//
// Integridade: manter pares user/assistant íntegros; nunca cortar no meio de um turno.
// Para CURIA: sem tool_use/result no histórico → verificação simplificada.

export async function autoCompact(
  messages: LLMMessage[],
  anthropic: Anthropic,
): Promise<CompactResult | null> {
  if (!shouldAutoCompact(messages)) return null

  const tokensBefore = roughTokenEstimate(messages)
  const toSummarize = messages.slice(0, -AUTOCOMPACT_KEEP_RECENT)
  const toKeep = messages.slice(-AUTOCOMPACT_KEEP_RECENT)

  // Garantir que o corte não deixe um assistente isolado no início do kept
  // (invariante: histórico deve começar com role='user')
  const safeKeep = toKeep[0]?.role === 'assistant'
    ? toKeep.slice(1)
    : toKeep

  const conversationText = toSummarize
    .map((m) => `${m.role === 'user' ? '【Fundador】' : '【Conselho】'} ${m.content}`)
    .join('\n\n')

  let summary = ''
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: 'Você é um assistente de memória estratégica preciso e conciso.',
      messages: [{ role: 'user', content: buildCompactPrompt(conversationText) }],
    })
    summary = (response.content[0] as { type: string; text: string }).text?.trim() ?? ''
  } catch (err) {
    // Fallback: sem sumário, só truncar (microCompact cuida do resto)
    console.warn('[autoCompact] Haiku falhou, usando truncação:', err)
    return {
      messages: safeKeep,
      summary: '',
      removed: toSummarize.length,
      estimatedTokensBefore: tokensBefore,
      estimatedTokensAfter: roughTokenEstimate(safeKeep),
    }
  }

  // Boundary: par user/assistant que representa o contexto anterior compactado.
  // Posicionado ANTES das mensagens recentes — preserva o fluxo da conversa.
  const boundaryPair: LLMMessage[] = [
    {
      role: 'user',
      content: `[Contexto estratégico das ${toSummarize.length} mensagens anteriores — compactado automaticamente para preservar contexto essencial]\n\n${summary}`,
    },
    {
      role: 'assistant',
      content: 'Contexto anterior registrado. Continuando a partir daqui.',
    },
  ]

  const compactedMessages = [...boundaryPair, ...safeKeep]

  return {
    messages: compactedMessages,
    summary,
    removed: toSummarize.length,
    estimatedTokensBefore: tokensBefore,
    estimatedTokensAfter: roughTokenEstimate(compactedMessages),
  }
}
