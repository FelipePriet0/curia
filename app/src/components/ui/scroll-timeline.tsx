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
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 128, height: 0 })

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

  // Observe container size to rebuild path and dot positions
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setDims({ width: 128, height: el.clientHeight })
    })
    ro.observe(el)
    setDims({ width: 128, height: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Build a hand-drawn like meandering path (Curia Script vibe)
  const buildPath = (w: number, h: number, segments: number) => {
    if (h <= 0) return ""
    const leftX = w * 0.2
    const rightX = w * 0.8
    const startX = leftX
    const startY = 0
    const dy = h / Math.max(1, segments)
    let d = `M ${startX} ${startY}`
    for (let i = 0; i < segments; i++) {
      const y1 = i * dy
      const y2 = (i + 1) * dy
      const fromX = i % 2 === 0 ? leftX : rightX
      const toX = i % 2 === 0 ? rightX : leftX
      const c1x = fromX
      const c1y = y1 + dy * 0.35
      const c2x = toX
      const c2y = y1 + dy * 0.65
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toX} ${y2}`
    }
    return d
  }

  const pathD = buildPath(dims.width, Math.max(dims.height, steps.length * 160), Math.max(steps.length, 3))

  // Update path length when path changes
  useEffect(() => {
    const p = pathRef.current
    if (!p) return
    try {
      const len = p.getTotalLength()
      setPathLength(len)
    } catch {}
  }, [pathD])

  // Position dots aligned to the visual vertical position of each step content
  useEffect(() => {
    const p = pathRef.current
    const el = containerRef.current
    if (!p || !el || pathLength === 0) return
    const containerTop = el.getBoundingClientRect().top + window.scrollY
    const height = el.clientHeight

    const pts: { x: number; y: number }[] = steps.map((_, i) => {
      const stepEl = stepRefs.current[i]
      let ratio = (i + 0.5) / steps.length
      if (stepEl) {
        const rect = stepEl.getBoundingClientRect()
        const centerY = rect.top + window.scrollY - containerTop + rect.height / 2
        ratio = Math.max(0, Math.min(1, centerY / Math.max(1, height)))
      }
      const at = ratio * pathLength
      try {
        const pt = p.getPointAtLength(at)
        return { x: pt.x, y: pt.y }
      } catch {
        return { x: 0, y: ratio * height }
      }
    })
    setPoints(pts)
  }, [steps, pathLength, dims.height])

  // Calculate which steps are "active" based on progress
  const activeCount = Math.floor(progress * steps.length) + 1

  const highlightBigTech = (text: string) => {
    const parts = text.split(/(Big Tech)/g)
    return parts.map((part, i) =>
      part === 'Big Tech' ? (
        <span key={i} className="italic text-[#0B0B0F]/50">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Curved timeline SVG */}
      <svg
        className="pointer-events-none absolute left-0 top-0 h-full w-32"
        viewBox={`0 0 ${dims.width} ${Math.max(dims.height, steps.length * 160)}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Base path */}
        <path d={pathD} stroke="var(--chamber-obsidian)" strokeOpacity="0.20" strokeWidth={3} fill="none" />
        {/* Progress path using dashoffset */}
        <path
          ref={pathRef}
          d={pathD}
          stroke="var(--chamber-obsidian)"
          strokeWidth={3}
          fill="none"
          strokeDasharray={pathLength || 1}
          strokeDashoffset={Math.max(0, (1 - progress) * (pathLength || 1))}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
        {/* Dots — each step uses a counselor color */}
        {points.map((pt, i) => (
          <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
            <circle r={16} fill="var(--chamber-obsidian)" />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="#FFFFFF"
            >
              {steps[i]?.number}
            </text>
          </g>
        ))}
      </svg>

      {/* Content aligned with a left padding to make room for the curve */}
      <div className="relative pl-40">
        {steps.map((step, i) => {
          const stepProgress = Math.max(0, Math.min(1, (progress * steps.length) - i))
          const isActive = stepProgress > 0.1
          const isFullyActive = stepProgress > 0.8

          return (
          <div
            ref={(el) => { stepRefs.current[i] = el }}
            key={i}
            className="relative pb-16 last:pb-0"
          >
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
                  isActive ? "text-[#0B0B0F]" : "text-[#0B0B0F]/30"
                }`}
              >
                {highlightBigTech(step.title)}
              </h3>
              <p
                className={`max-w-md text-sm leading-relaxed transition-colors duration-500 md:text-base ${
                  isActive ? "text-[#0B0B0F]/50" : "text-[#0B0B0F]/30"
                }`}
              >
                {highlightBigTech(step.description)}
              </p>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
