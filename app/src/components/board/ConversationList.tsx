'use client'

import { Plus, MessageSquare, ClipboardList, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { Conversation, Plan } from '@/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onNew: () => void
  loading?: boolean
  plans?: Plan[]
  onPlanSelect?: (plan: Plan) => void
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
  plans = [],
  onPlanSelect,
}: ConversationListProps) {
  const activePlans = plans.filter((p) => p.status === 'active')

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--brand-radius-md)] bg-[hsl(var(--primary))]">
            <span className="text-xs font-bold text-[hsl(var(--primary-foreground))]">C</span>
          </div>
          <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Curia Board</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onNew} title="New conversation">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Active Plans section */}
        {activePlans.length > 0 && (
          <div className="p-2 pb-0">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
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
                    className="w-full text-left rounded-[var(--radius)] px-3 py-2 text-sm transition-colors hover:bg-[hsl(var(--muted))]"
                  >
                    <div className="flex items-start gap-2">
                      <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[hsl(var(--foreground))]">
                          {plan.title}
                        </p>
                        {reviewDate && (
                          <p
                            className={cn(
                              'text-[10px]',
                              overdue || dueToday
                                ? 'text-[hsl(var(--primary))] font-medium'
                                : 'text-[hsl(var(--muted-foreground))]'
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
                        <Calendar className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(var(--primary))]" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mx-3 mt-2 border-b border-[hsl(var(--border))]" />
          </div>
        )}

        {/* Conversations */}
        <nav className="p-2 space-y-1">
          {loading ? (
            <div className="space-y-1 p-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-[var(--radius)] bg-[hsl(var(--muted))] animate-pulse"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-8 w-8 text-[hsl(var(--muted-foreground))] mb-2" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Nenhuma conversa ainda.
                <br />
                Traga um problema estratégico para o Board.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full text-left rounded-[var(--radius)] px-3 py-2 text-sm transition-colors truncate',
                  activeId === conv.id
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
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
