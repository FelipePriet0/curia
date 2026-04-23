'use client'

// Widget de feedback por mensagem do assistant.
//
// Camada 1 do protocolo A/B de COUNCIL_MODE:
//   - thumbs up/down é a entrada mínima (um clique e acabou)
//   - thumbs down abre o painel expandido automaticamente (é onde a sinalização
//     detalhada importa — feedback positivo costuma ser menos informativo)
//   - usuário também pode abrir o painel manualmente via "avaliar em detalhe"
//
// Campos do painel avançado:
//   - rating 1..5 (nota geral)
//   - 4 dimensões 1..5: utility, rigor, generic, actionable
//     (cruzadas com council_mode dão o sinal mais rico do A/B)
//   - comentário livre
//
// Depois do envio, o componente colapsa e mostra um "Obrigado" com um link
// discreto pra reeditar — o founder pode reavaliar a qualquer momento, e cada
// submissão é um novo registro em message_feedbacks.

import { useState } from 'react'

type Thumbs = 'up' | 'down'
type DimensionKey = 'utility' | 'rigor' | 'generic' | 'actionable'

interface Props {
  messageId: string
}

const DIMENSION_LABELS: Record<DimensionKey, { title: string; hint: string }> = {
  utility:    { title: 'Utilidade',    hint: 'Consegui agir com isso?' },
  rigor:      { title: 'Rigor',        hint: 'Análise sólida, sem superficialidade?' },
  generic:    { title: 'Específico',   hint: 'Calibrado pro meu contexto (não genérico)?' },
  actionable: { title: 'Acionável',    hint: 'Próximos passos claros?' },
}

export function MessageFeedback({ messageId }: Props) {
  const [thumbs, setThumbs] = useState<Thumbs | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState<Partial<Record<DimensionKey, number>>>({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function postFeedback(payload: Record<string, unknown>) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Falha ao enviar feedback')
      }
      setSubmitted(true)
      setExpanded(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSubmitting(false)
    }
  }

  function handleThumbs(value: Thumbs) {
    setThumbs(value)
    // Thumbs up: dispara imediatamente (1 clique = feedback).
    // Thumbs down: abre painel detalhado pra extrair o "porquê".
    if (value === 'up') {
      void postFeedback({ thumbs: 'up' })
    } else {
      setExpanded(true)
    }
  }

  async function handleSubmitDetailed() {
    if (!thumbs && rating == null) {
      setError('Escolha thumbs ou uma nota antes de enviar.')
      return
    }
    const usedDimensions = Object.fromEntries(
      Object.entries(dimensions).filter(([, v]) => typeof v === 'number'),
    )
    await postFeedback({
      thumbs: thumbs ?? undefined,
      rating: rating ?? undefined,
      dimensions: Object.keys(usedDimensions).length ? usedDimensions : undefined,
      comment: comment.trim() || undefined,
    })
  }

  function reset() {
    setSubmitted(false)
    setThumbs(null)
    setRating(null)
    setDimensions({})
    setComment('')
    setExpanded(false)
    setError(null)
  }

  if (submitted) {
    return (
      <div className="mt-2 flex items-center gap-3 pl-1 text-[11px] text-[#0B0B0F]/45 font-curia-serif">
        <span>Feedback registrado. Obrigado.</span>
        <button
          type="button"
          onClick={reset}
          className="underline underline-offset-2 hover:text-[#0B0B0F]/70"
        >
          Reavaliar
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 pl-1 font-curia-serif">
      {/* Linha principal: thumbs + toggle expandir */}
      <div className="flex items-center gap-3 text-[11px] text-[#0B0B0F]/45">
        <button
          type="button"
          aria-label="Resposta útil"
          disabled={submitting}
          onClick={() => handleThumbs('up')}
          className={
            'rounded-md px-1.5 py-0.5 transition-colors hover:bg-[#0B0B0F]/[0.06] disabled:opacity-40 '
            + (thumbs === 'up' ? 'bg-[#0B0B0F]/15 text-[#FDFBF9]' : '')
          }
        >
          <ThumbUpIcon />
        </button>
        <button
          type="button"
          aria-label="Resposta ruim"
          disabled={submitting}
          onClick={() => handleThumbs('down')}
          className={
            'rounded-md px-1.5 py-0.5 transition-colors hover:bg-[#0B0B0F]/[0.06] disabled:opacity-40 '
            + (thumbs === 'down' ? 'bg-[#0B0B0F]/15 text-[#FDFBF9]' : '')
          }
        >
          <ThumbDownIcon />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="underline underline-offset-2 hover:text-[#0B0B0F]/70"
        >
          {expanded ? 'Fechar detalhes' : 'avaliar em detalhe'}
        </button>
        {error && (
          <span className="text-[#B44B1F]">{error}</span>
        )}
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div className="mt-3 rounded-lg border border-[#0B0B0F]/10 bg-white/60 p-3 text-[12px] text-[#0B0B0F]/80">
          {/* Rating geral */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wider text-[#0B0B0F]/55">
              Nota geral
            </span>
            <StarRow value={rating} onChange={setRating} />
          </div>

          {/* Dimensões */}
          <div className="mt-3 space-y-2">
            {(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((key) => {
              const meta = DIMENSION_LABELS[key]
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-[#0B0B0F]">
                      {meta.title}
                    </span>
                    <span className="text-[10px] text-[#0B0B0F]/50">
                      {meta.hint}
                    </span>
                  </div>
                  <StarRow
                    value={dimensions[key] ?? null}
                    onChange={(v) =>
                      setDimensions((prev) => ({ ...prev, [key]: v ?? undefined }))
                    }
                  />
                </div>
              )
            })}
          </div>

          {/* Comentário */}
          <div className="mt-3">
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-[#0B0B0F]/55">
              O que faltou / o que funcionou
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-md border border-[#0B0B0F]/15 bg-white px-2 py-1.5 text-[12px] text-[#0B0B0F] outline-none transition-colors focus:border-[#C9A84C]/60"
              placeholder="Opcional. Ex: diagnóstico certo, mas recomendações genéricas."
            />
          </div>

          {/* Ações */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              disabled={submitting}
              className="rounded-md px-3 py-1 text-[12px] text-[#0B0B0F]/60 hover:text-[#0B0B0F] disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmitDetailed}
              disabled={submitting}
              className="rounded-md bg-[#0B0B0F] px-3 py-1 text-[12px] font-semibold text-[#FDFBF9] hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? 'Enviando...' : 'Enviar feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function StarRow({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value != null && n <= value
        return (
          <button
            key={n}
            type="button"
            aria-label={`Nota ${n}`}
            onClick={() => onChange(value === n ? null : n)}
            className="p-0.5 text-[#0B0B0F] transition-opacity hover:opacity-100"
            style={{ opacity: active ? 1 : 0.3 }}
          >
            <StarIcon filled={active} />
          </button>
        )
      })}
    </div>
  )
}

function ThumbUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7V10l4.49-8.05a1 1 0 0 1 1.42-.41l2.6 1.48a2 2 0 0 1 .99 2.4z" />
    </svg>
  )
}

function ThumbDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v12l-4.49 8.05a1 1 0 0 1-1.42.41l-2.6-1.48a2 2 0 0 1-.99-2.4z" />
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
