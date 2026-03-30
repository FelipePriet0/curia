'use client'

import type { CounselorState } from './chambraStates'

interface CounselorProps {
  color: string
  label: string
  state: CounselorState
  x: number
  y: number
  scale: number
  index: number
}

export function Counselor({ color, label, state, x, y, scale, index }: CounselorProps) {
  const breatheClass = `counselor-breathe-${index % 3}`
  const delay = `${index * 0.35}s`

  // Opacity levels per state
  const headOpacity  = state === 'idle' ? 0.7  : 0.95
  const bodyOpacity  = state === 'idle' ? 0.55 : 0.85
  const labelOpacity = state === 'idle' ? 0.35 : 0.7

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Ambient glow behind figure (active / thinking only) */}
      {state !== 'idle' && (
        <ellipse
          cx="0" cy="2"
          rx="26" ry="10"
          fill={color}
          opacity={state === 'thinking' ? 0.18 : 0.12}
          style={{ filter: 'blur(10px)' }}
        />
      )}

      {/* Animated figure group */}
      <g
        className={state === 'idle' ? breatheClass : state === 'thinking' ? 'counselor-thinking' : 'counselor-active'}
        style={{ animationDelay: delay, transformOrigin: '0px 0px' }}
      >
        {/* Head */}
        <circle cx="0" cy="-34" r="11" fill={color} opacity={headOpacity} />

        {/* Neck */}
        <rect x="-3" y="-23" width="6" height="8" rx="2" fill={color} opacity={bodyOpacity * 0.85} />

        {/* Torso — trapezoid (wider at shoulders, narrower at waist) */}
        <path
          d="M-19,-15 L19,-15 L13,12 L-13,12 Z"
          fill={color}
          opacity={bodyOpacity}
        />

        {/* Left arm — resting on table */}
        <path
          d="M-19,-10 Q-28,-6 -26,4"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity={bodyOpacity * 0.75}
        />

        {/* Right arm — resting on table */}
        <path
          d="M19,-10 Q28,-6 26,4"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity={bodyOpacity * 0.75}
        />
      </g>

      {/* Specialty label */}
      <text
        x="0"
        y="26"
        textAnchor="middle"
        fontSize="8"
        fill={color}
        opacity={labelOpacity}
        fontFamily="Inter, ui-sans-serif, sans-serif"
        letterSpacing="0.08em"
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
}
