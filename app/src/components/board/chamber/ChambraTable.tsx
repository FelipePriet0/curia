'use client'

import type { ChambraState } from './chambraStates'

interface ChambraTableProps {
  state: ChambraState
  keywords: string[]
}

interface FloatingKeyword {
  id: number
  text: string
  x: number
  delay: string
}

export function ChambraTable({ state, keywords }: ChambraTableProps) {
  const isActive = state === 'deliberating' || state === 'receiving'
  const isVerdict = state === 'verdict'

  // Map keywords to positioned chips
  const chips: FloatingKeyword[] = keywords.slice(-6).map((text, i) => ({
    id: i,
    text,
    x: 300 + (i % 3) * 85,
    delay: `${i * 0.15}s`,
  }))

  return (
    <g>
      {/* ── Floor ambient glow ── */}
      <ellipse
        cx="400" cy="370"
        rx="320" ry="60"
        fill="#C9A84C"
        opacity={isActive ? 0.05 : 0.02}
        style={{ filter: 'blur(30px)', transition: 'opacity 0.8s ease' }}
      />

      {/* ── Table body (3D edge / depth) ── */}
      <path
        d="M145,348 Q400,398 655,348 L655,358 Q400,408 145,358 Z"
        fill="#0F0F12"
        opacity={0.95}
      />
      <path
        d="M145,348 Q400,398 655,348"
        stroke="#C9A84C"
        strokeWidth="0.8"
        fill="none"
        opacity={0.25}
      />

      {/* ── Table surface (isometric ellipse) ── */}
      <ellipse
        cx="400" cy="338"
        rx="255" ry="68"
        fill="#111116"
        stroke="#C9A84C"
        strokeWidth={isActive ? 1.2 : 0.6}
        opacity={0.97}
        style={{ transition: 'stroke-width 0.5s ease' }}
      />

      {/* ── Table surface subtle texture line ── */}
      <ellipse
        cx="400" cy="338"
        rx="240" ry="62"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="0.3"
        opacity={0.12}
      />

      {/* ── Center glow disc (pulses during deliberation, blazes at verdict) ── */}
      <ellipse
        cx="400" cy="332"
        rx={isVerdict ? 90 : isActive ? 70 : 50}
        ry={isVerdict ? 28 : isActive ? 22 : 16}
        fill="#C9A84C"
        opacity={isVerdict ? 0.22 : isActive ? 0.1 : 0.04}
        style={{
          filter: 'blur(6px)',
          transition: 'all 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={isActive ? 'table-center-pulse' : ''}
      />
      <ellipse
        cx="400" cy="332"
        rx={isVerdict ? 40 : isActive ? 28 : 18}
        ry={isVerdict ? 12 : isActive ? 9 : 6}
        fill="#C9A84C"
        opacity={isVerdict ? 0.55 : isActive ? 0.2 : 0.07}
        style={{ transition: 'all 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />

      {/* ── Floating deliberation keywords ── */}
      {state === 'deliberating' && chips.map((chip) => (
        <g key={chip.id} className="keyword-chip" style={{ animationDelay: chip.delay }}>
          {/* Chip background */}
          <rect
            x={chip.x - 2}
            y="298"
            width={chip.text.length * 6 + 14}
            height="16"
            rx="8"
            fill="#1A1A1F"
            stroke="#C9A84C"
            strokeWidth="0.6"
            opacity="0.85"
          />
          <text
            x={chip.x + chip.text.length * 3 + 5}
            y="310"
            textAnchor="middle"
            fontSize="8"
            fill="#C9A84C"
            opacity="0.9"
            fontFamily="Inter, ui-sans-serif, sans-serif"
            letterSpacing="0.03em"
          >
            {chip.text}
          </text>
        </g>
      ))}
    </g>
  )
}
