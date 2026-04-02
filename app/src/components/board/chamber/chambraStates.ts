export type ChambraState = 'idle' | 'receiving' | 'deliberating' | 'verdict'

export type CounselorState = 'idle' | 'active' | 'thinking'

export function getChambraState({
  isStreaming,
  hasMessages,
  streamingContent,
}: {
  isStreaming: boolean
  hasMessages: boolean
  streamingContent: string
}): ChambraState {
  if (isStreaming && !streamingContent) return 'receiving'
  if (isStreaming && streamingContent) return 'deliberating'
  if (!isStreaming && hasMessages) return 'verdict'
  return 'idle'
}

export function getCounselorState(
  counselorId: string,
  chambraState: ChambraState,
  activeCounselorIds?: Set<string>,
): CounselorState {
  if (chambraState === 'idle' || chambraState === 'verdict') return 'idle'

  // Fase dos conselheiros: cada um anima quando está deliberando em paralelo
  if (activeCounselorIds && activeCounselorIds.size > 0) {
    return activeCounselorIds.has(counselorId) ? 'thinking' : 'active'
  }

  if (chambraState === 'receiving') {
    return ['strategy', 'finance', 'growth'].includes(counselorId) ? 'active' : 'idle'
  }

  // Fase de síntese: todos deliberando
  return 'thinking'
}

/** Domain-specific keywords shown above each active counselor during deliberation */
export const COUNSELOR_KEYWORDS: Record<string, string[]> = {
  strategy:   ['posicionamento', 'vantagem competitiva', 'diagnóstico', 'framework'],
  finance:    ['LTV/CAC', 'unit economics', 'margem', 'burn rate'],
  growth:     ['PMF', 'flywheel', 'North Star', 'coortes'],
  product:    ['jobs-to-be-done', 'aha moment', 'roadmap', 'churn'],
  operations: ['gargalo', 'restrição', 'throughput', 'escala'],
  brand:      ['percepção', 'mensagem', 'diferencial', 'voz'],
}
