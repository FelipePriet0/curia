'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { PlanScheduler } from './PlanScheduler'
import { hasNextSteps } from '@/lib/metrics/detectors'
import type { Message } from '@/types'

interface ChatAreaProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  onSend: (message: string) => void
  conversationId?: string
  conversationTitle?: string
  conversationType?: 'regular' | 'plan_origin' | 'plan_review'
  planScheduled?: boolean
  onPlanScheduled?: (planId: string, reviewDate: string) => void
}

export function ChatArea({
  messages,
  streamingContent,
  isStreaming,
  onSend,
  conversationId,
  conversationTitle,
  conversationType,
  planScheduled,
  onPlanScheduled,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const isEmpty = messages.length === 0 && !isStreaming

  // Show plan scheduler after last assistant message if it has next steps and no plan yet
  const lastAssistantMsg = !isStreaming
    ? [...messages].reverse().find((m) => m.role === 'assistant')
    : null
  const showScheduler =
    !planScheduled &&
    conversationType !== 'plan_origin' &&
    conversationType !== 'plan_review' &&
    lastAssistantMsg != null &&
    hasNextSteps(lastAssistantMsg.content)

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          conversationType === 'plan_review' ? (
            <ReviewEmptyState onSend={onSend} />
          ) : (
            <EmptyState onSend={onSend} />
          )
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === 'assistant' &&
                showScheduler &&
                msg.id === lastAssistantMsg?.id
              return (
                <div key={msg.id}>
                  <MessageBubble message={msg} />
                  {isLastAssistant && conversationId && (
                    <PlanScheduler
                      messageContent={msg.content}
                      conversationId={conversationId}
                      conversationTitle={conversationTitle || 'Plano estratégico'}
                      onScheduled={onPlanScheduled ?? (() => {})}
                    />
                  )}
                </div>
              )
            })}

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
          {conversationType !== 'plan_review' && (
            <div className="mb-2 flex flex-wrap gap-2">
              {USE_CASE_CHIPS.map((c) => (
                <Button
                  key={c.label}
                  size="sm"
                  variant="outline"
                  onClick={() => onSend(c.message)}
                  disabled={isStreaming}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          )}
          <ChatInput
            onSend={onSend}
            disabled={isStreaming}
            placeholder={
              conversationType === 'plan_review'
                ? 'O que avançou? O que travou? Mostre os números...'
                : 'Traga uma decisão ou problema estratégico para o Board...'
            }
          />
          <p className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
            Curia é um sistema de decisão. Use com senso crítico.
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onSend }: { onSend: (msg: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--brand-radius-xl)] bg-[hsl(var(--primary))]">
        <span className="text-2xl font-bold text-[hsl(var(--primary-foreground))]">C</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--foreground))]">
        Seu Board estratégico está pronto
      </h2>
      <p className="max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
        Traga crescimento, vendas, prioridade ou decisões binárias. O Board vai
        diagnosticar, reenquadrar, priorizar e recomendar um caminho claro.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {USE_CASE_CHIPS.map((c) => (
          <Button key={c.label} size="sm" variant="outline" onClick={() => onSend(c.message)}>
            {c.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ReviewEmptyState({ onSend }: { onSend: (msg: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--brand-radius-xl)] bg-[hsl(var(--primary))]">
        <span className="text-2xl font-bold text-[hsl(var(--primary-foreground))]">C</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--foreground))]">
        Sessão de revisão
      </h2>
      <p className="max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
        A Curia já tem o contexto do plano anterior. Conte o que avançou, o que
        travou, e mostre os números — o Board continua de onde parou.
      </p>
      <div className="mt-6">
        <Button onClick={() => onSend('Vamos revisar o plano. O que avançou e o que travou.')}>
          Iniciar revisão
        </Button>
      </div>
    </div>
  )
}

const USE_CASE_CHIPS = [
  {
    label: 'Não estou vendendo',
    message:
      'Não estou vendendo. Diagnostique o problema real (funil, proposta de valor, ICP, canal, preço) e recomende 3–5 ações priorizadas. Se precisar de contexto, pergunte objetivamente só o essencial antes de decidir.',
  },
  {
    label: 'Não consigo gerar lucro',
    message:
      'Não consigo gerar lucro. Avalie unit economics (ticket, margem, CAC, retenção) e dê um caminho claro para virar para positivo — com trade-offs explícitos.',
  },
  {
    label: 'Meu crescimento travou',
    message:
      'Meu crescimento travou. Enquadre a causa (produto, canal, preço, posicionamento, execução) e proponha alavancas com impacto esperado. Priorize pelo maior efeito composto (flywheel).',
  },
  {
    label: 'No que focar agora',
    message:
      'Tenho várias frentes e pouca tração. No que devo focar agora? Quero uma única recomendação com justificativa e riscos dos caminhos não escolhidos.',
  },
]
