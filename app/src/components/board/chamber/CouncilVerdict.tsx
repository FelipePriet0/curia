'use client'

import type { Message } from '@/types'

interface CouncilVerdictProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
}

interface Section {
  title: string
  body: string
}

function parseSections(content: string): Section[] {
  const lines = content.split('\n')
  const sections: Section[] = []
  let current: Section | null = null

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current)
      current = { title: line.replace(/^##\s+/, '').trim(), body: '' }
    } else if (line.startsWith('# ')) {
      // skip top-level titles
    } else if (current) {
      current.body += line + '\n'
    }
  }
  if (current) sections.push(current)
  return sections
    .map((s) => ({ ...s, body: s.body.trim() }))
    .filter((s) => s.body.length > 0)
}

// Group sections into the 4 verdict buckets
const BUCKET_MAP: Record<string, string> = {
  'Diagnóstico':              'diagnostico',
  'Problema Central':         'diagnostico',
  'Leitura de Performance':   'diagnostico',
  'Framework Aplicado':       'direcao',
  'Cases Relevantes':         'direcao',
  'Pressupostos a Questionar':'direcao',
  'Recomendações Estratégicas':'acoes',
  'Próximos Passos':           'acoes',
  'Checagem do Plano':         'acoes',
  'Riscos Estratégicos':       'riscos',
  'Perguntas Difíceis':        'riscos',
}

const BUCKETS = [
  { id: 'diagnostico', label: 'Diagnóstico',              color: '#C9A84C' },
  { id: 'direcao',     label: 'Direcionamento Estratégico', color: '#A8B5C0' },
  { id: 'acoes',       label: 'Ações Recomendadas',        color: '#4A9B6F' },
  { id: 'riscos',      label: 'Riscos',                    color: '#C06060' },
]

function renderBody(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    // Bold **text**
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} className="verdict-line">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </p>
    )
  })
}

export function CouncilVerdict({ messages, streamingContent, isStreaming }: CouncilVerdictProps) {
  // Show latest assistant content (streaming or complete)
  const latestAssistant = isStreaming
    ? streamingContent
    : [...messages].reverse().find((m) => m.role === 'assistant')?.content

  // Previous user+assistant pairs (all except the latest assistant)
  const assistantMessages = messages.filter((m) => m.role === 'assistant')
  const hasHistory = assistantMessages.length > (isStreaming ? 0 : 1)

  if (!latestAssistant && !isStreaming) return null

  const sections = latestAssistant ? parseSections(latestAssistant) : []

  const grouped: Record<string, Section[]> = {
    diagnostico: [], direcao: [], acoes: [], riscos: [],
  }

  const unmapped: Section[] = []
  for (const s of sections) {
    const bucket = BUCKET_MAP[s.title]
    if (bucket) grouped[bucket].push(s)
    else unmapped.push(s)
  }

  // If no structured sections found, show raw content
  const hasStructure = sections.length > 0

  return (
    <div className="council-verdict-wrapper">
      {/* History of previous consultations */}
      {hasHistory && (
        <div className="verdict-history">
          {messages
            .filter((m) => m.role === 'user')
            .slice(0, -1)
            .map((m) => (
              <div key={m.id} className="verdict-history-item">
                <span className="verdict-history-q">↳</span>
                <span className="verdict-history-text">{m.content.slice(0, 80)}{m.content.length > 80 ? '…' : ''}</span>
              </div>
            ))}
        </div>
      )}

      {/* Latest user question */}
      {messages.filter((m) => m.role === 'user').slice(-1).map((m) => (
        <div key={m.id} className="verdict-question">
          <span className="verdict-question-label">Questão submetida</span>
          <p className="verdict-question-text">{m.content}</p>
        </div>
      ))}

      {/* Streaming indicator or content */}
      {isStreaming && !latestAssistant && (
        <div className="verdict-deliberating">
          <span className="verdict-deliberating-dot" style={{ animationDelay: '0ms' }} />
          <span className="verdict-deliberating-dot" style={{ animationDelay: '150ms' }} />
          <span className="verdict-deliberating-dot" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {/* Structured verdict or raw */}
      {latestAssistant && (
        <div className="council-verdict-panel">
          <div className="verdict-header">
            <div className="verdict-header-line" />
            <span className="verdict-header-label">Parecer do Conselho</span>
            <div className="verdict-header-line" />
          </div>

          {hasStructure ? (
            <div className="verdict-buckets">
              {BUCKETS.map((bucket) => {
                const items = grouped[bucket.id]
                if (items.length === 0) return null
                return (
                  <div key={bucket.id} className="verdict-bucket">
                    <div className="verdict-bucket-title" style={{ color: bucket.color }}>
                      <span className="verdict-bucket-dot" style={{ background: bucket.color }} />
                      {bucket.label}
                    </div>
                    {items.map((section) => (
                      <div key={section.title} className="verdict-section">
                        {items.length > 1 && (
                          <p className="verdict-section-subtitle">{section.title}</p>
                        )}
                        <div className="verdict-section-body">
                          {renderBody(section.body)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* Unmapped sections rendered raw */}
              {unmapped.map((s) => (
                <div key={s.title} className="verdict-bucket">
                  <div className="verdict-bucket-title" style={{ color: '#8B9BB4' }}>
                    <span className="verdict-bucket-dot" style={{ background: '#8B9BB4' }} />
                    {s.title}
                  </div>
                  <div className="verdict-section-body">{renderBody(s.body)}</div>
                </div>
              ))}
            </div>
          ) : (
            // No structured sections — render markdown-ish raw content
            <div className="verdict-raw">
              {renderBody(latestAssistant)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
