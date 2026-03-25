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

