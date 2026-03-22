'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { Message } from '@/types'

interface ChatAreaProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  onSend: (message: string) => void
  conversationId?: string
}

export function ChatArea({
  messages,
  streamingContent,
  isStreaming,
  onSend,
  conversationId,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  conversation_id: conversationId || '',
                  role: 'assistant',
                  content: streamingContent,
                  created_at: new Date().toISOString(),
                }}
                isStreaming
              />
            )}

            {/* Thinking indicator */}
            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-[var(--brand-radius-lg)] rounded-bl-[var(--brand-radius-sm)] bg-[hsl(var(--muted))] px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={onSend}
            disabled={isStreaming}
            placeholder="Ask your strategic board anything..."
          />
          <p className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
            AI Board may make mistakes. Validate strategic decisions with trusted advisors.
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--brand-radius-xl)] bg-[hsl(var(--primary))]">
        <span className="text-2xl font-bold text-[hsl(var(--primary-foreground))]">AI</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--foreground))]">
        Your strategic board is ready
      </h2>
      <p className="max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
        Ask about growth, positioning, priorities, or any business challenge.
        Your board will diagnose, challenge, and guide your thinking.
      </p>
      <div className="mt-8 grid gap-2 w-full max-w-md">
        {EXAMPLE_QUESTIONS.map((q) => (
          <div
            key={q}
            className="rounded-[var(--radius)] border border-[hsl(var(--border))] px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] text-left"
          >
            {q}
          </div>
        ))}
      </div>
    </div>
  )
}

const EXAMPLE_QUESTIONS = [
  '💰 We\'re growing revenue but losing money every month. What should I do?',
  '🎯 I have 3 product ideas. How do I decide which one to focus on?',
  '⚡ My team is growing but execution is getting slower. Why?',
]
