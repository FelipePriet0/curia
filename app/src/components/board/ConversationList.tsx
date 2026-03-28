'use client'

import { Plus, MessageSquare, ClipboardList, Calendar, Layers, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { Conversation, Plan, Strategy } from '@/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onNew: () => void
  loading?: boolean
  plans?: Plan[]
  onPlanSelect?: (plan: Plan) => void
  strategies?: Strategy[]
  onStrategySelect?: (strategy: Strategy) => void
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
  plans = [],
  onPlanSelect,
  strategies = [],
  onStrategySelect,
}: ConversationListProps) {
  const activePlans = plans.filter((p) => p.status === 'active')

  // Conversations not linked to any strategy
  const regularConversations = conversations.filter((c) => !c.strategy_id)

  // Strategy conversations grouped by strategy_id
  const strategyConversations = conversations.filter((c) => c.strategy_id)
  const convsByStrategy = strategyConversations.reduce<Record<string, Conversation[]>>((acc, c) => {
    const sid = c.strategy_id!
    if (!acc[sid]) acc[sid] = []
    acc[sid].push(c)
    return acc
  }, {})

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
        <span className="font-curia-rounded text-[#2B1A07] text-2xl leading-none">Curia</span>
        <Button size="icon" variant="ghost" onClick={onNew} title="Nova consulta">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Strategies section */}
        {strategies.length > 0 && (
          <div className="p-2 pb-0">
            <p className="px-3 py-1.5 font-notably-alt text-[10px] tracking-wider text-[#2B1A07]/40">
              Estratégias
            </p>
            <div className="space-y-1">
              {strategies.map((strategy) => {
                const strategyConvs = convsByStrategy[strategy.id] ?? []
                const hasActive = strategyConvs.some((c) => c.id === activeId)

                return (
                  <div key={strategy.id}>
                    <button
                      onClick={() => onStrategySelect?.(strategy)}
                      className={cn(
                        'w-full text-left rounded-xl px-3 py-2 font-curia-serif text-sm transition-all',
                        hasActive
                          ? 'bg-[#FF6F1E]/15 text-[#2B1A07] font-medium'
                          : 'text-[#2B1A07]/70 hover:bg-[#2B1A07]/[0.06] hover:text-[#2B1A07]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-[#FF6F1E]" />
                        <span className="truncate flex-1">{strategy.name}</span>
                        <ChevronRight className="h-3 w-3 shrink-0 text-[#2B1A07]/30" />
                      </div>
                    </button>

                    {/* Conversations within this strategy */}
                    {strategyConvs.length > 0 && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[#FF6F1E]/20 pl-2">
                        {strategyConvs.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={cn(
                              'w-full text-left rounded-lg px-2 py-1.5 font-curia-serif text-xs transition-all truncate',
                              activeId === conv.id
                                ? 'bg-[#FF6F1E] text-[#2B1A07] font-medium shadow-sm'
                                : 'text-[#2B1A07]/55 hover:bg-[#2B1A07]/[0.06] hover:text-[#2B1A07]'
                            )}
                          >
                            {conv.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mx-3 mt-2 border-b" style={{ borderColor: 'rgba(201,168,76,0.1)' }} />
          </div>
        )}

        {/* Active Plans section */}
        {activePlans.length > 0 && (
          <div className="p-2 pb-0">
            <p className="px-3 py-1.5 font-notably-alt text-[10px] tracking-wider text-[#2B1A07]/40">
              Planos Ativos
            </p>
            <div className="space-y-1">
              {activePlans.map((plan) => {
                const reviewDate = plan.review_date ? new Date(plan.review_date + 'T00:00:00') : null
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const daysLeft = reviewDate
                  ? Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null
                const overdue = daysLeft !== null && daysLeft < 0
                const dueToday = daysLeft === 0

                return (
                  <button
                    key={plan.id}
                    onClick={() => onPlanSelect?.(plan)}
                    className="w-full text-left rounded-[var(--brand-radius-md)] px-3 py-2 text-sm transition-colors hover:bg-[#2B1A07]/[0.06]"
                  >
                    <div className="flex items-start gap-2">
                      <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6F1E]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[#2B1A07]/80">
                          {plan.title}
                        </p>
                        {reviewDate && (
                          <p
                            className={cn(
                              'text-[10px]',
                              overdue || dueToday
                                ? 'text-[#FF6F1E] font-medium'
                                : 'text-[#2B1A07]/45'
                            )}
                          >
                            {overdue
                              ? `Revisão atrasada`
                              : dueToday
                              ? 'Revisão hoje'
                              : `Revisão em ${daysLeft}d`}
                          </p>
                        )}
                      </div>
                      {(overdue || dueToday) && (
                        <Calendar className="mt-0.5 h-3 w-3 shrink-0 text-[#FF6F1E]" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mx-3 mt-2 border-b" style={{ borderColor: 'rgba(201,168,76,0.1)' }} />
          </div>
        )}

        {/* Regular Conversations */}
        <nav className="p-2 space-y-1">
          {loading ? (
            <div className="space-y-1 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 rounded-xl bg-[#2B1A07]/[0.06] animate-pulse" />
              ))}
            </div>
          ) : regularConversations.length === 0 && strategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-8 w-8 text-[#2B1A07]/25 mb-2" />
              <p className="font-curia-serif text-xs text-[#2B1A07]/40">
                Nenhuma conversa ainda.
                <br />
                Traga um problema estratégico para o Board.
              </p>
            </div>
          ) : (
            regularConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full text-left rounded-xl px-3 py-2 font-curia-serif text-sm transition-all truncate',
                  activeId === conv.id
                    ? 'bg-[#FF6F1E] text-[#2B1A07] font-medium shadow-sm'
                    : 'text-[#2B1A07]/70 hover:bg-[#2B1A07]/[0.06] hover:text-[#2B1A07]'
                )}
              >
                {conv.title}
              </button>
            ))
          )}
        </nav>
      </div>
    </div>
  )
}
