"use client"

import { useEffect, useRef, useState } from "react"

interface TimelineStep {
  number: string
  title: string
  description: string
}

interface ScrollTimelineProps {
  steps: TimelineStep[]
  className?: string
}

export function ScrollTimeline({ steps, className = "" }: ScrollTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0) // 0 to 1

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onScroll = () => {
      const rect = container.getBoundingClientRect()
      const windowH = window.innerHeight

      // Start filling when section top hits viewport center
      // Finish when section bottom hits viewport center
      const sectionTop = rect.top - windowH * 0.5
      const sectionBottom = rect.bottom - windowH * 0.7
      const total = sectionBottom - sectionTop

      if (total <= 0) return

      const raw = -sectionTop / total
      setProgress(Math.max(0, Math.min(1, raw)))
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll() // initial
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Calculate which steps are "active" based on progress
  const activeCount = Math.floor(progress * steps.length) + 1

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {steps.map((step, i) => {
        const stepProgress = Math.max(0, Math.min(1, (progress * steps.length) - i))
        const isActive = stepProgress > 0.1
        const isFullyActive = stepProgress > 0.8

        return (
          <div key={i} className="relative flex gap-8 pb-16 last:pb-0 md:gap-12">
            {/* Timeline track */}
            <div className="relative flex flex-col items-center">
              {/* Dot */}
              <div
                className={`
                  relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                  border-2 transition-all duration-500
                  ${isActive
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    : "border-white/20 bg-white/5"
                  }
                `}
              >
                <span
                  className={`text-xs font-bold transition-colors duration-500 ${
                    isActive ? "text-white" : "text-white/30"
                  }`}
                >
                  {step.number}
                </span>
              </div>

              {/* Line segment (not on last item) */}
              {i < steps.length - 1 && (
                <div className="relative mt-0 w-[2px] flex-1 bg-white/10">
                  {/* Fill line */}
                  <div
                    className="absolute inset-x-0 top-0 bg-[hsl(var(--primary))] transition-all duration-700 ease-out"
                    style={{
                      height: `${Math.max(0, Math.min(100, stepProgress * 100))}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div
              className={`
                flex-1 pt-1 transition-all duration-700
                ${isActive
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-20"
                }
              `}
            >
              <h3
                className={`mb-3 text-xl font-bold transition-colors duration-500 md:text-2xl ${
                  isActive ? "text-[#2B1A07]" : "text-[#2B1A07]/30"
                }`}
              >
                {step.title}
              </h3>
              <p
                className={`max-w-md text-sm leading-relaxed transition-colors duration-500 md:text-base ${
                  isActive ? "text-[#2B1A07]/80" : "text-[#2B1A07]/30"
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
