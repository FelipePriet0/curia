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
  chambraState: ChambraState
): CounselorState {
  if (chambraState === 'idle' || chambraState === 'verdict') return 'idle'
  if (chambraState === 'receiving') {
    return ['strategy', 'finance', 'growth'].includes(counselorId) ? 'active' : 'idle'
  }
  // deliberating: all active, but with slight variation
  return 'thinking'
}

const DELIBERATION_KEYWORDS = [
  'posicionamento', 'churn', 'LTV', 'CAC', 'flywheel',
  'proposta de valor', 'unit economics', 'crescimento', 'risco',
  'reposicionar', 'diferenciar', 'escalar', 'mercado', 'margem',
  'retenção', 'estratégia', 'prioridade', 'gargalo', 'momentum',
]

let keywordIndex = 0

export function getNextDeliberationKeyword(): string {
  const kw = DELIBERATION_KEYWORDS[keywordIndex % DELIBERATION_KEYWORDS.length]
  keywordIndex++
  return kw
}
