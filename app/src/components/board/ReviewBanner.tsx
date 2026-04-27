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
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#0B0B0F]/25 bg-[#0B0B0F]/[0.08] px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Calendar className="h-4 w-4 shrink-0 text-[#0B0B0F]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#0B0B0F]">
            Revisão pendente — {plan.title}
          </p>
          <p className="text-xs text-[#0B0B0F]/50">
            Agendada para {dateLabel}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onStartReview(plan.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0B0F] px-3 py-1.5 text-sm font-semibold text-[#FDFBF9] shadow-sm transition-all hover:opacity-90"
        >
          Iniciar <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDismiss(plan.id)}
          className="text-[#0B0B0F]/35 hover:text-[#0B0B0F]/70 transition-colors"
          aria-label="Dispensar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
