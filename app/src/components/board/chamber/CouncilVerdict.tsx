'use client'

import { useState } from 'react'
import type { Message } from '@/types'

interface CouncilVerdictProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
}

interface Section {
  title: string
  body: string
  layer: 1 | 2 | 3
}

// ─── Parse sections ───────────────────────────────────────────────────────────
// Handles both ## and ### headers (AI generates ###).
// Strips leading emoji/symbols from title, preserves accented chars.

function parseSections(content: string): Section[] {
  const lines = content.split('\n')
  const sections: Section[] = []
  let current: { title: string; body: string } | null = null

  for (const line of lines) {
    if (line.match(/^#{2,3}\s+/)) {
      if (current) sections.push({ ...current, layer: findLayer(current.title) })
      const rawTitle = line.replace(/^#{2,3}\s+/, '').trim()
      // Strip leading emoji/symbols; keep first Latin or accented letter onward
      const title = rawTitle.replace(/^[^A-Za-zÀ-öø-ÿ\u00C0-\u024F]+/, '').trim()
      current = { title, body: '' }
    } else if (current) {
      current.body += line + '\n'
    }
  }
  if (current) sections.push({ ...current, layer: findLayer(current.title) })

  return sections
    .map((s) => ({ ...s, body: s.body.trim() }))
    .filter((s) => s.body.length > 0)
}

// ─── Layer assignment ─────────────────────────────────────────────────────────
// Layer 1 — Decisão       (sempre visível)
// Layer 2 — Entendimento  (colapsável)
// Layer 3 — Profundidade  (colapsável)

function findLayer(title: string): 1 | 2 | 3 {
  const t = title.toLowerCase()
  if (t.includes('diagnós') || t.includes('problema central') ||
      t.includes('recomend') || t.includes('próximos') || t.includes('proximos')) return 1
  if (t.includes('risco') || t.includes('performance') ||
      t.includes('framework') || t.includes('pressup')) return 2
  if (t.includes('case') || t.includes('pergunta') || t.includes('checag')) return 3
  return 1
}

// ─── Render markdown body ─────────────────────────────────────────────────────
// Handles bold (**text**), bullet lists (- item), numbered lists (1. item).

function renderInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, j) =>
    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
  )
}

function renderBody(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />

    if (line.match(/^[-*]\s+/)) {
      return (
        <p key={i} className="verdict-line verdict-bullet">
          <span className="verdict-bullet-dot" />
          <span>{renderInline(line.replace(/^[-*]\s+/, ''))}</span>
        </p>
      )
    }

    if (line.match(/^\d+\.\s+/)) {
      const num = line.match(/^(\d+)\./)?.[1]
      return (
        <p key={i} className="verdict-line verdict-numbered">
          <span className="verdict-numbered-n">{num}</span>
          <span>{renderInline(line.replace(/^\d+\.\s+/, ''))}</span>
        </p>
      )
    }

    return <p key={i} className="verdict-line">{renderInline(line)}</p>
  })
}

// ─── Collapsible layer ────────────────────────────────────────────────────────

function CollapsibleLayer({
  label,
  sublabel,
  accentColor,
  children,
}: {
  label: string
  sublabel: string
  accentColor: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="verdict-layer-collapse">
      <button
        className="verdict-layer-toggle"
        onClick={() => setOpen((o) => !o)}
        style={{ '--layer-accent': accentColor } as React.CSSProperties}
      >
        <span className="verdict-layer-chevron">{open ? '▾' : '▸'}</span>
        <span className="verdict-layer-label">{label}</span>
        {!open && sublabel && (
          <span className="verdict-layer-sublabel">{sublabel}</span>
        )}
      </button>
      {open && (
        <div className="verdict-layer-content">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CouncilVerdict({ messages, streamingContent, isStreaming }: CouncilVerdictProps) {
  const latestAssistant = isStreaming
    ? streamingContent
    : [...messages].reverse().find((m) => m.role === 'assistant')?.content

  const assistantMessages = messages.filter((m) => m.role === 'assistant')
  const hasHistory = assistantMessages.length > (isStreaming ? 0 : 1)

  if (!latestAssistant && !isStreaming) return null

  const sections = latestAssistant ? parseSections(latestAssistant) : []
  const hasStructure = sections.length > 0

  const layer1 = sections.filter((s) => s.layer === 1)
  const layer2 = sections.filter((s) => s.layer === 2)
  const layer3 = sections.filter((s) => s.layer === 3)

  // Merge Recomendações + Próximos Passos → bloco visual "Plano de Ação"
  const isPlano = (s: Section) =>
    s.title.toLowerCase().includes('recomend') ||
    s.title.toLowerCase().includes('próximos') ||
    s.title.toLowerCase().includes('proximos')
  const planoSections = layer1.filter(isPlano)
  const otherL1 = layer1.filter((s) => !isPlano(s))

  return (
    <div className="council-verdict-wrapper">

      {/* Histórico de consultas anteriores */}
      {hasHistory && (
        <div className="verdict-history">
          {messages
            .filter((m) => m.role === 'user')
            .slice(0, -1)
            .map((m) => (
              <div key={m.id} className="verdict-history-item">
                <span className="verdict-history-q">↳</span>
                <span className="verdict-history-text">
                  {m.content.slice(0, 80)}{m.content.length > 80 ? '…' : ''}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Questão atual */}
      {messages.filter((m) => m.role === 'user').slice(-1).map((m) => (
        <div key={m.id} className="verdict-question">
          <span className="verdict-question-label">Questão submetida</span>
          <p className="verdict-question-text">{m.content}</p>
        </div>
      ))}

      {/* Indicador de deliberação */}
      {isStreaming && !latestAssistant && (
        <div className="verdict-deliberating">
          <span className="verdict-deliberating-dot" style={{ animationDelay: '0ms' }} />
          <span className="verdict-deliberating-dot" style={{ animationDelay: '150ms' }} />
          <span className="verdict-deliberating-dot" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {latestAssistant && (
        <div className="council-verdict-panel">
          {hasStructure ? (
            <div className="verdict-layers">

              {/* ── CAMADA 1 — Decisão (sempre visível) ─────────────────── */}
              <div className="verdict-layer-1">

                {/* Diagnóstico, Problema Central, etc. */}
                {otherL1.map((section) => (
                  <div key={section.title} className="verdict-l1-section">
                    <p className="verdict-l1-label">{section.title}</p>
                    <div className="verdict-section-body">
                      {renderBody(section.body)}
                    </div>
                  </div>
                ))}

                {/* Plano de Ação = Recomendações + Próximos Passos unidos */}
                {planoSections.length > 0 && (
                  <div className="verdict-l1-section verdict-plano">
                    <p className="verdict-l1-label verdict-plano-label">
                      Plano de Ação
                      <span className="verdict-plano-tag">7–14 dias</span>
                    </p>
                    {planoSections.map((s, idx) => (
                      <div key={s.title}>
                        {planoSections.length > 1 && (
                          <p className="verdict-section-subtitle">{s.title}</p>
                        )}
                        <div className="verdict-section-body">
                          {renderBody(s.body)}
                        </div>
                        {idx < planoSections.length - 1 && (
                          <div className="verdict-plano-divider" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* ── CAMADA 2 — Entendimento (colapsável) ────────────────── */}
              {layer2.length > 0 && (
                <CollapsibleLayer
                  label="Entender o raciocínio"
                  sublabel={layer2.map((s) => s.title).join(' · ')}
                  accentColor="#A8B5C0"
                >
                  {layer2.map((section) => (
                    <div key={section.title} className="verdict-collapse-section">
                      <p className="verdict-collapse-title">{section.title}</p>
                      <div className="verdict-section-body">
                        {renderBody(section.body)}
                      </div>
                    </div>
                  ))}
                </CollapsibleLayer>
              )}

              {/* ── CAMADA 3 — Profundidade (colapsável) ────────────────── */}
              {layer3.length > 0 && (
                <CollapsibleLayer
                  label="Aprofundar análise"
                  sublabel={layer3.map((s) => s.title).join(' · ')}
                  accentColor="#C9A84C"
                >
                  {layer3.map((section) => (
                    <div key={section.title} className="verdict-collapse-section">
                      <p className="verdict-collapse-title">{section.title}</p>
                      <div className="verdict-section-body">
                        {renderBody(section.body)}
                      </div>
                    </div>
                  ))}
                </CollapsibleLayer>
              )}

            </div>
          ) : (
            <div className="verdict-raw">
              {renderBody(latestAssistant)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
