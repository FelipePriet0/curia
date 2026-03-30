'use client'

import { useEffect, useState } from 'react'
import { COUNSELORS } from './counselors.config'
import { getCounselorState, getNextDeliberationKeyword } from './chambraStates'
import type { ChambraState } from './chambraStates'

// ─── Isometric Math ───────────────────────────────────────────────────────────
// Origin (room center), scale factors
const OX = 400, OY = 288
const SX = 38   // screen px per iso X unit
const SY = 21   // screen px per iso Y unit
const SZ = 40   // screen px per iso Z unit (height)

/** Convert iso (x,y,z) → screen [sx, sy] */
function iso(ix: number, iy: number, iz = 0): [number, number] {
  return [
    OX + (ix - iy) * SX,
    OY + (ix + iy) * SY - iz * SZ,
  ]
}

/** ISO coords → SVG point string (used by Box) */
function p(ix: number, iy: number, iz = 0): string {
  const [x, y] = iso(ix, iy, iz)
  return `${x.toFixed(1)},${y.toFixed(1)}`
}

// ─── Primitive: Isometric Box ─────────────────────────────────────────────────
function Box({ ix, iy, iz = 0, w, d, h, ct, cr, cl, opacity = 1 }: {
  ix: number; iy: number; iz?: number
  w: number; d: number; h: number
  ct: string; cr: string; cl: string
  opacity?: number
}) {
  return (
    <g opacity={opacity}>
      {/* Left face (+Y side) */}
      <polygon points={`${p(ix,iy+d,iz)} ${p(ix+w,iy+d,iz)} ${p(ix+w,iy+d,iz+h)} ${p(ix,iy+d,iz+h)}`} fill={cl} />
      {/* Right face (+X side) */}
      <polygon points={`${p(ix+w,iy,iz)} ${p(ix+w,iy+d,iz)} ${p(ix+w,iy+d,iz+h)} ${p(ix+w,iy,iz+h)}`} fill={cr} />
      {/* Top face */}
      <polygon points={`${p(ix,iy,iz+h)} ${p(ix+w,iy,iz+h)} ${p(ix+w,iy+d,iz+h)} ${p(ix,iy+d,iz+h)}`} fill={ct} />
    </g>
  )
}

// ─── Scene constants ──────────────────────────────────────────────────────────
const TABLE_H = 0.8   // table top height
const TABLE_R = 1.30  // table radius in iso units

// Table ellipse in screen space
const TABLE_RX = TABLE_R * SX * Math.SQRT2
const TABLE_RY = TABLE_R * SY * Math.SQRT2
const [TABLE_CX, TABLE_CY] = iso(0, 0, TABLE_H)

// Per-counselor 3-face colors [top, right, left]
const CHAR_COLORS: [string, string, string][] = [
  ['#EAC96A', '#C9A84C', '#9A7E30'],  // Estratégia — gold
  ['#C8D8E4', '#A0B8C4', '#6E90A0'],  // Finanças   — silver
  ['#6AC090', '#4A9B6F', '#27764A'],  // Growth     — green
  ['#6A90C8', '#4A6FA5', '#28507F'],  // Produto    — blue
  ['#AABBD8', '#8A9BB4', '#637590'],  // Operações  — steel
  ['#BD8ED8', '#9B6BB4', '#754E8C'],  // Marca      — purple
]

// Positions derived from screen-space: each seat ≈20px outside table ellipse edge,
// then back-projected to iso coords so they appear symmetric around the table visually.
// Back seats (ix+iy < 0 → drawn before table)
const BACK_SEATS = [
  [-2.1, -2.1,  0],  // Estratégia — top center
  [ 0.4, -2.0,  1],  // Finanças   — right
  [-2.0,  0.4,  5],  // Marca      — left
] as [number, number, number][]
// Front seats (ix+iy > 0 → drawn after table)
const FRONT_SEATS = [
  [0.65, 0.65, null],  // Founder chair — bottom center, no counselor
] as [number, number, number | null][]
const sortedBack  = [...BACK_SEATS ].sort((a, b) => iso(a[0],a[1])[1] - iso(b[0],b[1])[1])
const sortedFront = [...FRONT_SEATS].sort((a, b) => iso(a[0],a[1])[1] - iso(b[0],b[1])[1])

// ─── Sub-components ───────────────────────────────────────────────────────────
function Chair({ ix, iy }: { ix: number; iy: number }) {
  const [sx, sy] = iso(ix, iy, 0)
  const angleDeg = Math.atan2(sy - TABLE_CY, sx - TABLE_CX) * (180 / Math.PI)
  return (
    <g transform={`translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(${(angleDeg + 90).toFixed(1)})`}>
      <circle r={13} fill="#94a3b8" opacity={0.92} />
      <path d="M -11 -13 Q 0 -20 11 -13" fill="none" stroke="#64748b" strokeWidth={4} strokeLinecap="round" />
    </g>
  )
}

// Isometric box character — body keeps volume/posture; only the head face rotates toward table
function IsoCharacter({
  ix, iy, shirt,
}: {
  ix: number; iy: number
  shirt: [string, string, string]
}) {
  const pants = ['#7A8CA3', '#5E6E83', '#6A7C91'] as [string, string, string]
  const skin  = ['#F4D1B0', '#E2BFA0', '#D1AC8E'] as [string, string, string]

  const torso = { x: ix - 0.22, y: iy - 0.20, z: 0.22, w: 0.44, d: 0.44, h: 0.62 }
  const legL  = { x: ix - 0.18, y: iy - 0.02, z: 0.00, w: 0.16, d: 0.16, h: 0.26 }
  const legR  = { x: ix + 0.02, y: iy - 0.02, z: 0.00, w: 0.16, d: 0.16, h: 0.26 }
  const armL  = { x: ix - 0.30, y: iy - 0.06, z: 0.50, w: 0.10, d: 0.30, h: 0.18 }
  const armR  = { x: ix + 0.20, y: iy - 0.06, z: 0.50, w: 0.10, d: 0.30, h: 0.18 }
  const shoeL = { x: ix - 0.18, y: iy + 0.12, z: 0.00, w: 0.16, d: 0.12, h: 0.08 }
  const shoeR = { x: ix + 0.02, y: iy + 0.12, z: 0.00, w: 0.16, d: 0.12, h: 0.08 }

  // Head: positioned at correct iso height, face rotated to look at table center
  const [hx, hy] = iso(ix, iy, 1.07)
  const angleDeg = Math.atan2(hy - TABLE_CY, hx - TABLE_CX) * (180 / Math.PI)
  const faceDeg  = angleDeg + 270   // flip: now points TOWARD table, not away

  return (
    <g>
      {/* Legs */}
      <Box ix={legL.x} iy={legL.y} iz={legL.z} w={legL.w} d={legL.d} h={legL.h} ct={pants[0]} cr={pants[1]} cl={pants[2]} opacity={0.95} />
      <Box ix={legR.x} iy={legR.y} iz={legR.z} w={legR.w} d={legR.d} h={legR.h} ct={pants[0]} cr={pants[1]} cl={pants[2]} opacity={0.95} />
      {/* Shoes */}
      <Box ix={shoeL.x} iy={shoeL.y} iz={shoeL.z} w={shoeL.w} d={shoeL.d} h={shoeL.h} ct="#1F2937" cr="#111827" cl="#111827" opacity={0.96} />
      <Box ix={shoeR.x} iy={shoeR.y} iz={shoeR.z} w={shoeR.w} d={shoeR.d} h={shoeR.h} ct="#1F2937" cr="#111827" cl="#111827" opacity={0.96} />
      {/* Torso */}
      <Box ix={torso.x} iy={torso.y} iz={torso.z} w={torso.w} d={torso.d} h={torso.h} ct={shirt[0]} cr={shirt[1]} cl={shirt[2]} opacity={1} />
      {/* Arms */}
      <Box ix={armL.x} iy={armL.y} iz={armL.z} w={armL.w} d={armL.d} h={armL.h} ct={shirt[0]} cr={shirt[1]} cl={shirt[2]} opacity={1} />
      <Box ix={armR.x} iy={armR.y} iz={armR.z} w={armR.w} d={armR.d} h={armR.h} ct={shirt[0]} cr={shirt[1]} cl={shirt[2]} opacity={1} />
      {/* Hands */}
      <Box ix={armL.x} iy={armL.y + armL.d} iz={armL.z} w={armL.w} d={0.08} h={0.10} ct={skin[0]} cr={skin[1]} cl={skin[2]} opacity={0.98} />
      <Box ix={armR.x} iy={armR.y + armR.d} iz={armR.z} w={armR.w} d={0.08} h={0.10} ct={skin[0]} cr={skin[1]} cl={skin[2]} opacity={0.98} />
      {/* Head — flat circle at iso z=1.07; face group rotated toward table */}
      <g transform={`translate(${hx.toFixed(1)}, ${hy.toFixed(1)})`}>
        <circle r="9" fill={skin[0]} />
        <g transform={`rotate(${faceDeg.toFixed(1)})`}>
          {/* Hair: back of head (local +Y = away from table) */}
          <ellipse cx="0" cy="5.5" rx="8.5" ry="5" fill="#2B2B2B" opacity={0.78} />
          {/* Eyes: front of head (local −Y = toward table) */}
          <circle cx="-3" cy="-3" r="1.4" fill="#3A2A1A" opacity={0.68} />
          <circle cx=" 3" cy="-3" r="1.4" fill="#3A2A1A" opacity={0.68} />
        </g>
      </g>
    </g>
  )
}

function CouncilMember({
  ix, iy, ci, state, chambraState,
}: { ix: number; iy: number; ci: number; state: string; chambraState: ChambraState }) {
  const [ct, cr, cl] = CHAR_COLORS[ci]
  const isActive = state === 'active' || state === 'thinking'
  const animClass = state === 'thinking'
    ? 'counselor-thinking'
    : isActive ? 'counselor-active' : `counselor-breathe-${ci % 3}`

  const [lx, ly] = iso(ix, iy, 1.45)

  return (
    <g>
      <g
        className={animClass}
        style={{ animationDelay: `${ci * 0.35}s`, transformOrigin: `${iso(ix,iy)[0]}px ${iso(ix,iy)[1]}px` }}
      >
        <IsoCharacter ix={ix} iy={iy} shirt={[ct, cr, cl]} />
      </g>

      {/* Specialty label (unchanged) */}
      <text
        x={lx} y={ly}
        textAnchor="middle"
        fontSize="7"
        fill={COUNSELORS[ci].color}
        opacity={isActive ? 0.85 : 0.38}
        fontFamily="Inter, ui-sans-serif, sans-serif"
        letterSpacing="0.07em"
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        {COUNSELORS[ci].label}
      </text>
    </g>
  )
}

// ─── Main Chamber ─────────────────────────────────────────────────────────────
export function CuriaChambra({ state }: { state: ChambraState }) {
  const [keywords, setKeywords] = useState<string[]>([])

  useEffect(() => {
    if (state !== 'deliberating') { setKeywords([]); return }
    const add = () => setKeywords(prev => [...prev, getNextDeliberationKeyword()].slice(-5))
    add()
    const t = setInterval(add, 1800)
    return () => clearInterval(t)
  }, [state])

  const isActive  = state === 'deliberating' || state === 'receiving'
  const isVerdict = state === 'verdict'

  const stateLabel: Record<ChambraState, string> = {
    idle:         'Conselho disponível',
    receiving:    'Questão recebida',
    deliberating: 'Deliberando…',
    verdict:      'Parecer emitido',
  }

  return (
    <div className="curia-chamber-wrapper">
      <svg viewBox="0 0 800 440" className="curia-chamber-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mt-grad" cx="38%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#dbe4ef" />
            <stop offset="100%" stopColor="#bfcbda" />
          </radialGradient>
        </defs>

        {/* Ambient glow under table (state-reactive) */}
        <ellipse
          cx={iso(0, 0, 0)[0]} cy={iso(0, 0, 0)[1]}
          rx="155" ry="72"
          fill="#C9A84C"
          opacity={isActive ? 0.07 : isVerdict ? 0.10 : 0.02}
          style={{ filter: 'blur(18px)', transition: 'opacity 0.9s ease' }}
        />

        {/* ════════════════════════════════════════════════════════════
            BACK CHARACTERS + CHAIRS
        ════════════════════════════════════════════════════════════ */}
        {sortedBack.map(([six, siy, ci]) => {
          const csState = getCounselorState(COUNSELORS[ci].id, state)
          return (
            <g key={ci}>
              <Chair ix={six} iy={siy} />
              <CouncilMember ix={six} iy={siy} ci={ci} state={csState} chambraState={state} />
            </g>
          )
        })}

        {/* ════════════════════════════════════════════════════════════
            ROUND TABLE
        ════════════════════════════════════════════════════════════ */}
        {/* Drop shadow */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY + 5}
          rx={TABLE_RX + 4} ry={TABLE_RY + 3}
          fill="rgba(0,0,0,0.09)"
          style={{ filter: 'blur(4px)' }}
        />
        {/* Table surface */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY}
          rx={TABLE_RX} ry={TABLE_RY}
          fill="url(#mt-grad)"
          stroke="#94a3b8"
          strokeWidth={isActive ? 2 : 1.5}
          style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.10))' }}
        />
        {/* Inner ring detail */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY}
          rx={TABLE_RX * 0.72} ry={TABLE_RY * 0.72}
          fill="none" stroke="#aabbd0" strokeWidth="0.6" opacity="0.45"
        />
        {/* Center glow (state feedback) */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY}
          rx={isVerdict ? 62 : isActive ? 44 : 20}
          ry={isVerdict ? 34 : isActive ? 24 : 11}
          fill="#C9A84C"
          opacity={isVerdict ? 0.22 : isActive ? 0.10 : 0.02}
          style={{ filter: 'blur(8px)', transition: 'all 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          className={isActive ? 'table-center-pulse' : ''}
        />

        {/* Floating keywords during deliberation */}
        {state === 'deliberating' && keywords.map((kw, i) => {
          const kwx = TABLE_CX + (i % 3 - 1) * 58
          const kwy = TABLE_CY - 14 - Math.floor(i / 3) * 20
          return (
            <g key={`${kw}-${i}`} className="keyword-chip" style={{ animationDelay: `${i * 0.12}s` }}>
              <rect
                x={kwx - kw.length * 3 - 7} y={kwy - 10}
                width={kw.length * 6 + 14} height={15}
                rx="7.5" fill="#F5F0EC" stroke="#C9A84C" strokeWidth="0.8" opacity="0.96"
              />
              <text
                x={kwx} y={kwy}
                textAnchor="middle" fontSize="8"
                fill="#C9A84C" opacity="0.95"
                fontFamily="Inter, ui-sans-serif, sans-serif"
                letterSpacing="0.04em"
              >
                {kw}
              </text>
            </g>
          )
        })}

        {/* ════════════════════════════════════════════════════════════
            FRONT CHARACTERS + CHAIRS
        ════════════════════════════════════════════════════════════ */}
        {sortedFront.map(([six, siy, ci]) => {
          if (ci === null) {
            // Founder chair — empty seat, no counselor
            return <g key="founder"><Chair ix={six} iy={siy} /></g>
          }
          const csState = getCounselorState(COUNSELORS[ci].id, state)
          return (
            <g key={ci}>
              <Chair ix={six} iy={siy} />
              <CouncilMember ix={six} iy={siy} ci={ci} state={csState} chambraState={state} />
            </g>
          )
        })}

        {/* ── CURIA watermark ── */}
        <text
          x="400" y="432"
          textAnchor="middle" fontSize="8" fill="#C9A84C" opacity="0.15"
          fontFamily="Inter, ui-sans-serif, sans-serif"
          letterSpacing="0.3em"
          style={{ textTransform: 'uppercase', userSelect: 'none' }}
        >
          CURIA
        </text>
      </svg>
    </div>
  )
}
