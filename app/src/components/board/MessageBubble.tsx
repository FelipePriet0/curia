'use client'

import { cn } from '@/lib/utils/cn'
import { stripStrategyMarker } from '@/lib/metrics/detectors'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[#0B0B0F] text-[#FDFBF9] rounded-br-sm font-medium'
            : 'bg-[#0B0B0F]/[0.06] text-[#0B0B0F] rounded-bl-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <BoardResponse content={stripStrategyMarker(message.content)} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  )
}

function BoardResponse({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const missing = isStreaming ? [] : detectMissingSections(content)
  return (
    <div className="space-y-4">
      {!isStreaming && missing.length > 0 && (
        <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
          Estrutura incompleta: faltam {missing.join(', ')}.
        </div>
      )}
      <MarkdownContent content={content} />
      {isStreaming && (
        <span className="inline-block h-4 w-1 animate-pulse bg-[#0B0B0F] rounded-full" />
      )}
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown renderer for the Board's structured response
  const lines = content.split('\n')

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="font-semibold text-[hsl(var(--foreground))] mt-4 first:mt-0">
              {line.replace('### ', '')}
            </h3>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="font-bold text-base text-[hsl(var(--foreground))] mt-4 first:mt-0">
              {line.replace('## ', '')}
            </h2>
          )
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-4 list-disc text-[hsl(var(--foreground))]">
              {line.replace(/^[-*] /, '')}
            </li>
          )
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-semibold">
              {line.replace(/\*\*/g, '')}
            </p>
          )
        }
        if (line.trim() === '---') {
          return <hr key={i} className="border-[hsl(var(--border))] my-2" />
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />
        }
        // Inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} className="text-[hsl(var(--foreground))]">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
              ) : (
                part
              )
            )}
          </p>
        )
      })}
    </div>
  )
}

// ─── Guardrail: detectar seções obrigatórias ──────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/^[^a-z0-9()]+/g, '')
    .trim()
}

function detectMissingSections(content: string): string[] {
  const lines = content.split('\n')
  const headers = lines
    .filter((l) => l.trim().startsWith('### '))
    .map((l) => normalize(l.replace(/^###\s+/, '')))

  const required = [
    { key: 'diagnostico', label: 'Diagnóstico' },
    { key: 'problema central', label: 'Problema Central' },
    { key: 'riscos estrategicos', label: 'Riscos Estratégicos' },
    { key: 'leitura de performance', label: 'Leitura de Performance' },
    { key: 'framework aplicado', label: 'Framework Aplicado' },
    { key: 'recomendacoes estrategicas', label: 'Recomendações Estratégicas' },
  ]

  const missing: string[] = []
  for (const req of required) {
    const found = headers.some((h) => h.includes(req.key))
    if (!found) missing.push(req.label)
  }
  return missing
}
