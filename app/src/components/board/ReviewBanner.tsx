'use client'

import { Calendar, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/types'

interface ReviewBannerProps {
  plan: Plan
  onStartReview: (planId: string) => void
  onDismiss: (planId: string) => void
}

export function ReviewBanner({ plan, onStartReview, onDismiss }: ReviewBannerProps) {
  const reviewDate = plan.review_date ? new Date(plan.review_date + 'T00:00:00') : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysOverdue = reviewDate
    ? Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const dateLabel =
    daysOverdue === 0 ? 'hoje' : `há ${daysOverdue} dia${daysOverdue !== 1 ? 's' : ''}`

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--primary)/30%)] bg-[hsl(var(--primary)/8%)] px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Calendar className="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
            Revisão pendente — {plan.title}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Agendada para {dateLabel}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={() => onStartReview(plan.id)}>
          Iniciar <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
        <button
          onClick={() => onDismiss(plan.id)}
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          aria-label="Dispensar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
