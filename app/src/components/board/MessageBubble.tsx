'use client'

import { cn } from '@/lib/utils/cn'
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
          'max-w-[85%] rounded-[var(--brand-radius-lg)] px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-br-[var(--brand-radius-sm)]'
            : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-[var(--brand-radius-sm)]'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <BoardResponse content={message.content} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  )
}

function BoardResponse({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className="space-y-4">
      <MarkdownContent content={content} />
      {isStreaming && (
        <span className="inline-block h-4 w-1 animate-pulse bg-[hsl(var(--primary))] rounded-full" />
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
