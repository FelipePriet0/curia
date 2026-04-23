// ─── Council Mode — Feature flag + A/B sampling ──────────────────────────────
//
// Três modos de operação da fase do conselho:
//
//   'full'               → 6 Haikus paralelos + síntese (fluxo original)
//   'direct'             → sem Haikus; síntese recebe um guia interno com as 6 lentes
//                           como checklist (A/B justo: mesmo modelo, mesma qualidade de prompt)
//   'synthetic_council'  → emite eventos counselor_start/end para animar a UI,
//                           mas SEM chamar Haiku. Só pra isolar "o comitê é ritual UI?"
//
// Duas formas de uso:
//
//   a) Modo global via env COUNCIL_MODE   → para rodar o produto inteiro num modo.
//   b) A/B sampling sticky por user       → ativa com COUNCIL_AB_SAMPLING=true.
//      Cada user vai pro mesmo bucket sempre (determinístico no userId), o que
//      garante que a experiência dentro de uma mesma empresa seja coerente e
//      evita poluir o dado trocando de modo no meio de uma conversa.
//
// A distribuição padrão no A/B é 33/33/33 entre os três modos.
// Pode ser controlada via COUNCIL_AB_WEIGHTS="full:1,direct:1,synthetic_council:1".

export type CouncilMode = 'full' | 'direct' | 'synthetic_council'

const VALID_MODES: readonly CouncilMode[] = ['full', 'direct', 'synthetic_council'] as const
const DEFAULT_MODE: CouncilMode = 'full'

function parseMode(raw: string | undefined | null): CouncilMode | null {
  if (!raw) return null
  const norm = raw.toLowerCase().trim()
  return (VALID_MODES as readonly string[]).includes(norm) ? (norm as CouncilMode) : null
}

/** Modo global da env — fallback quando o A/B está desligado. */
export function getGlobalCouncilMode(): CouncilMode {
  return parseMode(process.env.COUNCIL_MODE) ?? DEFAULT_MODE
}

function isAbSamplingEnabled(): boolean {
  return process.env.COUNCIL_AB_SAMPLING === 'true'
}

// Hash FNV-1a 32-bit — determinístico, barato, sem deps.
function fnv1a(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h >>> 0
}

function parseWeights(): Record<CouncilMode, number> {
  const raw = process.env.COUNCIL_AB_WEIGHTS
  const defaults: Record<CouncilMode, number> = { full: 1, direct: 1, synthetic_council: 1 }
  if (!raw) return defaults
  const out = { ...defaults }
  for (const part of raw.split(',')) {
    const [k, v] = part.split(':').map((s) => s.trim())
    const mode = parseMode(k)
    const weight = Number(v)
    if (mode && Number.isFinite(weight) && weight >= 0) out[mode] = weight
  }
  return out
}

/**
 * Resolve o modo para um user específico.
 * Sticky: mesmo userId → sempre o mesmo bucket (determinístico).
 * Permite A/B real mantendo a experiência coerente por fundador.
 */
export function resolveCouncilModeForUser(userId: string | undefined | null): CouncilMode {
  if (!isAbSamplingEnabled() || !userId) return getGlobalCouncilMode()

  const weights = parseWeights()
  const total = weights.full + weights.direct + weights.synthetic_council
  if (total <= 0) return getGlobalCouncilMode()

  // Bucket determinístico no hash do userId → 0..(total-1)
  const bucket = fnv1a(userId) % total
  let cumulative = 0
  for (const mode of VALID_MODES) {
    cumulative += weights[mode]
    if (bucket < cumulative) return mode
  }
  return DEFAULT_MODE
}
