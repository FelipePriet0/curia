// ─── DeliberationStore — AppState pattern aplicado ao CURIA ──────────────────
// Inspirado no AppStateStore do Agentfriend:
// estado central com transições tipadas e efeitos derivados determinísticos.
//
// Em vez de useReducer/useState espalhados, um único objeto descreve
// tudo sobre a deliberação atual.

import type { QueryEvent } from '@/lib/llm/query-loop'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DeliberationPhase =
  | 'idle'        // nenhuma deliberação em andamento
  | 'counselors'  // conselheiros deliberando em paralelo (Haiku)
  | 'synthesis'   // síntese em andamento (modelo principal streaming)
  | 'done'        // parecer completo
  | 'error'       // erro recuperável ou fatal

export interface DeliberationState {
  phase: DeliberationPhase
  turn: number
  tokens: number           // estimativa atual de tokens no contexto
  tokenBudget: number      // janela efetiva do modelo
  compactedCount: number   // quantas vezes compactou esta sessão
  lastError: { code: string; message: string } | null
  activeCounselorIds: Set<string>
  counselorBriefs: Map<string, string>  // id → brief text (por conselheiro concluído)
}

// ─── Estado inicial ───────────────────────────────────────────────────────────

export function getInitialDeliberationState(): DeliberationState {
  return {
    phase: 'idle',
    turn: 0,
    tokens: 0,
    tokenBudget: 120_000,
    compactedCount: 0,
    lastError: null,
    activeCounselorIds: new Set(),
    counselorBriefs: new Map(),
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
// Transição determinística: (state, event) → nextState
// Sem side effects. Testável isoladamente.

export function deliberationReducer(
  state: DeliberationState,
  event: QueryEvent | { type: 'stream_start' } | { type: 'stream_end' },
): DeliberationState {
  switch (event.type) {
    case 'stream_start':
      return {
        ...getInitialDeliberationState(),
        tokenBudget: state.tokenBudget,
        phase: 'counselors',  // primeira fase sempre é counselors
      }

    case 'token_estimate':
      return { ...state, tokens: event.tokens, tokenBudget: event.budget }

    case 'turn':
      return { ...state, turn: event.turn }

    case 'counselor_start': {
      const next = new Set(state.activeCounselorIds)
      next.add(event.counselorId)
      return { ...state, phase: 'counselors', activeCounselorIds: next }
    }

    case 'counselor_end': {
      const next = new Set(state.activeCounselorIds)
      next.delete(event.counselorId)
      const nextBriefs = new Map(state.counselorBriefs)
      nextBriefs.set(event.counselorId, event.brief)
      // Todos os conselheiros terminaram → fase de síntese
      const phase: DeliberationPhase = next.size === 0 ? 'synthesis' : 'counselors'
      return { ...state, activeCounselorIds: next, counselorBriefs: nextBriefs, phase }
    }

    case 'delta':
      // Primeiro delta confirma síntese (caso counselors terminem sem emitir counselor_end)
      return state.phase === 'counselors'
        ? { ...state, phase: 'synthesis', activeCounselorIds: new Set() }
        : state

    case 'compact':
      return {
        ...state,
        compactedCount: state.compactedCount + 1,
        tokens: event.tokensAfter ?? state.tokens,
      }

    case 'error':
      return { ...state, phase: 'error', lastError: { code: event.code, message: event.message } }

    case 'done':
      return { ...state, phase: 'done', activeCounselorIds: new Set() }

    case 'stream_end':
      return { ...state, phase: 'idle', activeCounselorIds: new Set() }

    default:
      return state
  }
}

// ─── Efeitos derivados ────────────────────────────────────────────────────────

/** Percentual de contexto usado (0-100) */
export function contextUsagePercent(state: DeliberationState): number {
  if (state.tokenBudget === 0 || state.tokens === 0) return 0
  return Math.min(100, Math.round((state.tokens / state.tokenBudget) * 100))
}

/** Cor do badge de contexto */
export function contextBadgeColor(pct: number): string {
  if (pct >= 75) return '#C06060'   // vermelho — próximo do limite
  if (pct >= 45) return '#C9A84C'   // gold — atenção
  return '#4A9B6F'                  // verde — saudável
}

/** Texto do badge de contexto */
export function contextBadgeLabel(state: DeliberationState): string | null {
  const pct = contextUsagePercent(state)
  if (pct === 0) return null
  if (state.compactedCount > 0) return `${pct}% · ${state.compactedCount}× compact`
  return `${pct}%`
}
