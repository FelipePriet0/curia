'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { COUNSELORS } from './chamber/counselors.config'
import type { DeliberationState } from '@/lib/deliberation/store'
import { cn } from '@/lib/utils/cn'

interface TimelineStep {
  label: string
  done: boolean
}

interface Props {
  deliberation: DeliberationState
  streamingContent: string
}

export function DeliberationTimeline({ deliberation, streamingContent }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [steps, setSteps] = useState<TimelineStep[]>([])

  useEffect(() => {
    const next: TimelineStep[] = []

    // Step 1 — always present once streaming starts
    next.push({
      label: 'Questão recebida pelo Board',
      done: !!streamingContent,
    })

    // Steps per counselor brief
    COUNSELORS.forEach(c => {
      const brief = deliberation.counselorBriefs.get(c.id)
      if (!brief) return
      next.push({
        label: `${c.label} — ${brief.length > 42 ? brief.slice(0, 42) + '…' : brief}`,
        done: deliberation.phase === 'synthesis',
      })
    })

    // Synthesis step
    if (deliberation.phase === 'synthesis' || deliberation.counselorBriefs.size > 0) {
      next.push({
        label: 'Sintetizando parecer…',
        done: false,
      })
    }

    setSteps(next)
  }, [deliberation, streamingContent])

  // Current active label = last undone step, or last step
  const activeStep = [...steps].reverse().find(s => !s.done) ?? steps[steps.length - 1]
  const currentLabel = activeStep?.label ?? 'Deliberando…'

  return (
    <div className="shrink-0 border-b border-[#0B0B0F]/6 bg-[#FDFBF9]">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-2.5 px-4 py-2 text-left"
      >
        {/* Pulsing orange dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0B0B0F] opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0B0B0F]" />
        </span>

        <span className="flex-1 truncate font-curia-serif text-xs text-[#0B0B0F]/55">
          {currentLabel}
        </span>

        <ChevronDown
          size={13}
          className={cn(
            'shrink-0 text-[#0B0B0F]/25 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && steps.length > 0 && (
        <div className="space-y-1.5 px-4 pb-3 pt-0.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
                  step.done
                    ? 'bg-[#0B0B0F]/20'
                    : 'bg-[#0B0B0F] animate-pulse'
                )}
              />
              <span
                className={cn(
                  'font-curia-serif text-[11px] leading-snug',
                  step.done ? 'text-[#0B0B0F]/35' : 'text-[#0B0B0F]/65'
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
