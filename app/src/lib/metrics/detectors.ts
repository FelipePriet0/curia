// ─── Minimal detectors for value metrics ─────────────────────────────────────

export function isPlanRequest(text: string): boolean {
  const t = (text || '').toLowerCase()
  return [
    'plano',
    'qual o plano',
    'manda o plano',
    'o que faço agora',
    'o que fazer agora',
    'vamos nessa',
    'fechado',
    'ok, entendi',
  ].some((k) => t.includes(k))
}

function hasSection(text: string, marker: string): boolean {
  const t = (text || '').toLowerCase()
  return t.includes(`### ${marker}`.toLowerCase())
}

export function hasDiagnosis(text: string): boolean {
  return hasSection(text, '🔍 diagnóstico') || hasSection(text, 'diagnóstico')
}

export function hasProblemCentral(text: string): boolean {
  return hasSection(text, '🎯 problema central') || hasSection(text, 'problema central')
}

// Detecta se a resposta tem plano acionável.
//
// A seção "▶️ Próximos Passos" foi fundida em "💡 Recomendações Estratégicas":
// cada recomendação agora carrega "Movimento desta semana" + "Como saber que
// funcionou" como parte da própria unidade. O sinal de plano acionável passa a
// ser a presença da seção de recomendações JUNTO com pelo menos uma ocorrência
// da marca de movimento semanal — se só tem recomendação solta sem prazo, não
// é plano pronto pra agendamento.
//
// Backward compat: mantemos os marcadores antigos ("▶️ Próximos Passos", etc)
// porque conversas antigas no histórico podem ter sido geradas com o scaffold
// anterior e ainda precisam ser reconhecidas como tendo plano.
export function hasNextSteps(text: string): boolean {
  const t = (text || '').toLowerCase()
  const hasRecomendacoes =
    hasSection(text, '💡 recomendações estratégicas') ||
    hasSection(text, 'recomendações estratégicas')
  const hasMovimento = t.includes('movimento desta semana')
  if (hasRecomendacoes && hasMovimento) return true

  // Legacy scaffold (pré-fusão de Próximos Passos em Recomendações).
  return (
    hasSection(text, '▶️ próximos passos') ||
    hasSection(text, 'próximos passos (7') ||
    hasSection(text, 'próximos passos')
  )
}

// ─── Strategy proposal helpers (Plano 5) ─────────────────────────────────────

const STRATEGY_MARKER = '\n[STRATEGY_PROPOSAL]:'

export function hasStrategyProposal(text: string): boolean {
  return text.includes(STRATEGY_MARKER)
}

export function extractStrategyProposal(text: string): import('@/types').StrategyProposal | null {
  const idx = text.lastIndexOf(STRATEGY_MARKER)
  if (idx === -1) return null
  try {
    return JSON.parse(text.slice(idx + STRATEGY_MARKER.length).trim())
  } catch {
    return null
  }
}

export function stripStrategyMarker(text: string): string {
  const idx = text.lastIndexOf(STRATEGY_MARKER)
  if (idx === -1) return text
  return text.slice(0, idx).trimEnd()
}
