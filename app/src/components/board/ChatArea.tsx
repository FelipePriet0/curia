'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { PlanScheduler } from './PlanScheduler'
import { StrategyProposalBanner } from './StrategyProposalBanner'
import { hasNextSteps } from '@/lib/metrics/detectors'
import { ContextDisclaimer } from '@/components/ui/ContextDisclaimer'
import type { Message, StrategyProposal } from '@/types'

interface ChatAreaProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  onSend: (message: string) => void
  conversationId?: string
  conversationTitle?: string
  conversationType?: 'regular' | 'plan_origin' | 'plan_review' | 'strategy'
  planScheduled?: boolean
  onPlanScheduled?: (planId: string, reviewDate: string) => void
  strategyProposal?: StrategyProposal | null
  onStrategySaved?: (strategyId: string, strategyName: string) => void
  onStrategyProposalDismiss?: () => void
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
  strategyProposal,
  onStrategySaved,
  onStrategyProposalDismiss,
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

  const isSensitiveContext = (
    conversationType === 'plan_origin' ||
    conversationType === 'plan_review' ||
    conversationType === 'strategy' ||
    showScheduler
  )

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
            {isSensitiveContext && (
              <ContextDisclaimer />
            )}
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
                <div className="rounded-xl rounded-bl-sm bg-[#2B1A07]/[0.06] px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-[#FF6F1E] animate-bounce"
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

      {/* Strategy Proposal Banner */}
      {strategyProposal && conversationId && !isStreaming && (
        <StrategyProposalBanner
          proposal={strategyProposal}
          conversationId={conversationId}
          onSaved={onStrategySaved ?? (() => {})}
          onDismiss={onStrategyProposalDismiss ?? (() => {})}
        />
      )}

      {/* Input */}
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4">
        <div className="mx-auto max-w-3xl">
          {conversationType !== 'plan_review' && (
            <div className="mb-2 flex flex-wrap gap-2">
              {USE_CASE_CHIPS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => onSend(c.message)}
                  disabled={isStreaming}
                  className="rounded-full border border-[#2B1A07]/12 bg-white px-3 py-1 font-curia-serif text-xs text-[#2B1A07]/60 shadow-sm transition-all hover:border-[#FF6F1E]/40 hover:text-[#2B1A07] hover:shadow disabled:pointer-events-none disabled:opacity-40"
                >
                  {c.label}
                </button>
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
          <p className="mt-2 text-center font-curia-serif text-xs text-[#2B1A07]/35">
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
      {/* Glow decorativo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[400px] w-[400px] rounded-full bg-[#FF6F1E] opacity-[0.05] blur-3xl" />
      </div>

      <div className="relative">
        <span className="font-curia-rounded text-[#2B1A07] text-5xl leading-none mb-4 block">
          Curia
        </span>
        <h2 className="font-curia-rounded text-xl text-[#2B1A07] mb-3">
          Seu Board estratégico está pronto
        </h2>
        <p className="max-w-sm font-curia-serif text-sm leading-relaxed text-[#2B1A07]/55">
          Traga crescimento, vendas, prioridade ou decisões binárias. O Board vai
          diagnosticar, reenquadrar, priorizar e recomendar um caminho claro.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {USE_CASE_CHIPS.map((c) => (
            <button
              key={c.label}
              onClick={() => onSend(c.message)}
              className="rounded-full border border-[#2B1A07]/15 bg-white px-4 py-1.5 font-curia-serif text-sm text-[#2B1A07]/70 shadow-sm transition-all hover:border-[#FF6F1E]/50 hover:text-[#2B1A07] hover:shadow-md"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewEmptyState({ onSend }: { onSend: (msg: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      {/* Glow decorativo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[400px] w-[400px] rounded-full bg-[#FF6F1E] opacity-[0.05] blur-3xl" />
      </div>

      <div className="relative">
        <span className="font-curia-rounded text-[#2B1A07] text-5xl leading-none mb-4 block">
          Curia
        </span>
        <h2 className="font-curia-rounded text-xl text-[#2B1A07] mb-3">
          Sessão de revisão
        </h2>
        <p className="max-w-sm font-curia-serif text-sm leading-relaxed text-[#2B1A07]/55">
          A Curia já tem o contexto do plano anterior. Conte o que avançou, o que
          travou, e mostre os números — o Board continua de onde parou.
        </p>
        <div className="mt-7">
          <button
            onClick={() => onSend('Vamos revisar o plano. O que avançou e o que travou.')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6F1E] px-6 py-3 font-curia-serif text-sm font-semibold text-[#2B1A07] shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Iniciar revisão
          </button>
        </div>
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
