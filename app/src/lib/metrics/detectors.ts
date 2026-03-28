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

export function hasNextSteps(text: string): boolean {
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
