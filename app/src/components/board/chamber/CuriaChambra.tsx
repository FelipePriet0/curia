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

/** SVG point string */
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

// ─── Room constants ───────────────────────────────────────────────────────────
const ROOM   = 4      // half-size of room in iso units (walls at ±4)
const WALL_H = 2.4    // wall height in iso units

// Wall + floor palette — warm office neutrals
const C_WALL_R  = '#F0EBE4'  // right-leaning back wall (iy = -ROOM, faces viewer)
const C_WALL_L  = '#E6E0D9'  // left-leaning back wall  (ix = -ROOM, faces viewer)
const C_FLOOR_A = '#F5F1EC'  // floor tile light
const C_FLOOR_B = '#EAE5DF'  // floor tile dark (checker)

// ─── Floor checkerboard ───────────────────────────────────────────────────────
function FloorGrid() {
  const tiles: React.ReactNode[] = []
  for (let ix = -ROOM; ix < ROOM; ix++) {
    for (let iy = -ROOM; iy < ROOM; iy++) {
      const dark = (ix + iy + 8) % 2 === 0
      const pts = [p(ix, iy), p(ix + 1, iy), p(ix + 1, iy + 1), p(ix, iy + 1)].join(' ')
      tiles.push(
        <polygon
          key={`f${ix},${iy}`}
          points={pts}
          fill={dark ? C_FLOOR_B : C_FLOOR_A}
          stroke="#DDD8D2"
          strokeWidth="0.3"
        />
      )
    }
  }
  return <>{tiles}</>
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

// 6 seat positions [ix, iy, counselorIndex]
const BACK_SEATS  = [[0, -2, 0], [1.73, -1, 1], [-1.73, -1, 5]] as const
const FRONT_SEATS = [[1.73, 1, 2], [0, 2, 3], [-1.73, 1, 4]] as const
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

// Office-style isometric character composed of boxes
function IsoCharacter({
  ix, iy,
  shirt,
  pants = ['#7A8CA3', '#5E6E83', '#6A7C91'] as [string,string,string],
  skin  = ['#F4D1B0', '#E2BFA0', '#D1AC8E'] as [string,string,string],
  hair  = ['#2B2B2B', '#1F1F1F', '#353535'] as [string,string,string],
}: {
  ix: number; iy: number;
  shirt: [string,string,string]
  pants?: [string,string,string]
  skin?:  [string,string,string]
  hair?:  [string,string,string]
}) {
  const torso = { x: ix - 0.22, y: iy - 0.20, z: 0.22, w: 0.44, d: 0.44, h: 0.62 }
  const head  = { x: ix - 0.16, y: iy - 0.16, z: 0.90, w: 0.32, d: 0.32, h: 0.34 }
  const hairB = { x: ix - 0.16, y: iy - 0.16, z: 1.18, w: 0.32, d: 0.32, h: 0.10 }
  const legL  = { x: ix - 0.18, y: iy - 0.02, z: 0.00, w: 0.16, d: 0.16, h: 0.26 }
  const legR  = { x: ix + 0.02, y: iy - 0.02, z: 0.00, w: 0.16, d: 0.16, h: 0.26 }
  const armL  = { x: ix - 0.30, y: iy - 0.06, z: 0.50, w: 0.10, d: 0.30, h: 0.18 }
  const armR  = { x: ix + 0.20, y: iy - 0.06, z: 0.50, w: 0.10, d: 0.30, h: 0.18 }
  const shoeL = { x: ix - 0.18, y: iy + 0.12, z: 0.00, w: 0.16, d: 0.12, h: 0.08 }
  const shoeR = { x: ix + 0.02, y: iy + 0.12, z: 0.00, w: 0.16, d: 0.12, h: 0.08 }

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
      {/* Head + hair cap */}
      <Box ix={head.x} iy={head.y} iz={head.z} w={head.w} d={head.d} h={head.h} ct={skin[0]} cr={skin[1]} cl={skin[2]} opacity={1} />
      <Box ix={hairB.x} iy={hairB.y} iz={hairB.z} w={hairB.w} d={hairB.d} h={hairB.h} ct={hair[0]} cr={hair[1]} cl={hair[2]} opacity={1} />
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

  // Pre-compute line endpoints (avoids p().split(',') ugliness)
  const [wallCornerBx, wallCornerBy] = iso(-ROOM, -ROOM, 0)
  const [wallCornerTx, wallCornerTy] = iso(-ROOM, -ROOM, WALL_H)
  const [wallRTopRx, wallRTopRy]     = iso( ROOM, -ROOM, WALL_H)
  const [wallLTopLx, wallLTopLy]     = iso(-ROOM,  ROOM, WALL_H)
  const [wallRBotRx, wallRBotRy]     = iso( ROOM, -ROOM, 0)
  const [wallLBotLx, wallLBotLy]     = iso(-ROOM,  ROOM, 0)

  return (
    <div className="curia-chamber-wrapper">
      {/* State badge */}
      <div className="curia-state-label">
        <span className={`curia-state-dot ${state === 'idle' ? 'dot-idle' : state === 'deliberating' ? 'dot-active' : 'dot-gold'}`} />
        <span>{stateLabel[state]}</span>
      </div>

      <svg viewBox="0 0 800 440" className="curia-chamber-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mt-grad" cx="38%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#dbe4ef" />
            <stop offset="100%" stopColor="#bfcbda" />
          </radialGradient>
        </defs>

        {/* ════════════════════════════════════════════════════════════
            ROOM — back walls (drawn first, everything else on top)
        ════════════════════════════════════════════════════════════ */}

        {/* Left back wall (ix = -ROOM) — left-leaning, slightly darker */}
        <polygon
          points={`${p(-ROOM,-ROOM,0)} ${p(-ROOM,ROOM,0)} ${p(-ROOM,ROOM,WALL_H)} ${p(-ROOM,-ROOM,WALL_H)}`}
          fill={C_WALL_L}
        />
        {/* Right back wall (iy = -ROOM) — right-leaning, lighter (catches light) */}
        <polygon
          points={`${p(-ROOM,-ROOM,0)} ${p(ROOM,-ROOM,0)} ${p(ROOM,-ROOM,WALL_H)} ${p(-ROOM,-ROOM,WALL_H)}`}
          fill={C_WALL_R}
        />

        {/* ── Wall top cornice lines (gold accent) ── */}
        <line
          x1={wallCornerTx} y1={wallCornerTy}
          x2={wallRTopRx}   y2={wallRTopRy}
          stroke="#C9A84C" strokeWidth="0.9" opacity="0.28"
        />
        <line
          x1={wallCornerTx} y1={wallCornerTy}
          x2={wallLTopLx}   y2={wallLTopLy}
          stroke="#C9A84C" strokeWidth="0.9" opacity="0.20"
        />

        {/* ── Back-corner crease shadow ── */}
        <line
          x1={wallCornerBx} y1={wallCornerBy}
          x2={wallCornerTx} y2={wallCornerTy}
          stroke="#B0A89E" strokeWidth="1.4" opacity="0.55"
        />

        {/* ── Window on right wall (iy = -ROOM), centred at ix=0, z 0.7→1.7 ── */}
        {/* Glass pane */}
        <polygon
          points={`${p(-0.8,-ROOM,0.7)} ${p(0.8,-ROOM,0.7)} ${p(0.8,-ROOM,1.7)} ${p(-0.8,-ROOM,1.7)}`}
          fill="#C8DDE8"
          opacity="0.50"
        />
        {/* Window frame */}
        <polygon
          points={`${p(-0.8,-ROOM,0.7)} ${p(0.8,-ROOM,0.7)} ${p(0.8,-ROOM,1.7)} ${p(-0.8,-ROOM,1.7)}`}
          fill="none"
          stroke="#B0A080"
          strokeWidth="1.4"
          opacity="0.70"
        />
        {/* Vertical pane divider */}
        <line
          x1={iso(0,-ROOM,0.7)[0]}  y1={iso(0,-ROOM,0.7)[1]}
          x2={iso(0,-ROOM,1.7)[0]}  y2={iso(0,-ROOM,1.7)[1]}
          stroke="#B0A080" strokeWidth="0.7" opacity="0.50"
        />
        {/* Horizontal pane divider */}
        <line
          x1={iso(-0.8,-ROOM,1.2)[0]} y1={iso(-0.8,-ROOM,1.2)[1]}
          x2={iso( 0.8,-ROOM,1.2)[0]} y2={iso( 0.8,-ROOM,1.2)[1]}
          stroke="#B0A080" strokeWidth="0.7" opacity="0.50"
        />
        {/* Warm light spill on floor from window */}
        <ellipse
          cx={iso(0.2, -2.8, 0)[0]} cy={iso(0.2, -2.8, 0)[1]}
          rx="62" ry="28"
          fill="#F0D890"
          opacity="0.07"
          style={{ filter: 'blur(7px)' }}
        />

        {/* ── Bookshelf on left wall (ix = -ROOM) ── */}
        {/* Shelf casing */}
        <Box ix={-ROOM} iy={-2.8} iz={0} w={0.38} d={2.2} h={1.45}
             ct="#C8A870" cr="#A08050" cl="#B89060" />
        {/* Shelf mid-divider panel */}
        <Box ix={-ROOM} iy={-2.8} iz={0.68} w={0.38} d={2.2} h={0.06}
             ct="#B09058" cr="#907040" cl="#A08050" opacity={0.7} />
        {/* Books — bottom row */}
        <Box ix={-ROOM} iy={-2.65} iz={0.06} w={0.22} d={0.40} h={0.55} ct="#9B4A4A" cr="#7A3838" cl="#8C4040" />
        <Box ix={-ROOM} iy={-2.18} iz={0.06} w={0.22} d={0.38} h={0.52} ct="#4A6FA5" cr="#385588" cl="#3D5E94" />
        <Box ix={-ROOM} iy={-1.73} iz={0.06} w={0.22} d={0.40} h={0.56} ct="#4A9B6F" cr="#377850" cl="#3A885C" />
        <Box ix={-ROOM} iy={-1.25} iz={0.06} w={0.22} d={0.38} h={0.50} ct="#9B7A4A" cr="#7A5C38" cl="#8C6840" />
        {/* Books — top row */}
        <Box ix={-ROOM} iy={-2.65} iz={0.80} w={0.22} d={0.42} h={0.48} ct="#8C4A9B" cr="#6A3880" cl="#7A4290" />
        <Box ix={-ROOM} iy={-2.15} iz={0.80} w={0.22} d={0.36} h={0.52} ct="#C9A84C" cr="#A08834" cl="#B0963C" />
        <Box ix={-ROOM} iy={-1.72} iz={0.80} w={0.22} d={0.40} h={0.45} ct="#5A9BA5" cr="#407888" cl="#488494" />

        {/* ── Potted plant, left wall near front ── */}
        {/* Pot */}
        <Box ix={-ROOM} iy={1.8} iz={0} w={0.32} d={0.32} h={0.38} ct="#8C6030" cr="#6A4820" cl="#7A5428" />
        {/* Foliage layer 1 */}
        <Box ix={-ROOM-0.04} iy={1.76} iz={0.38} w={0.40} d={0.40} h={0.48} ct="#3A8A42" cr="#286A30" cl="#2E7A38" opacity={0.92} />
        {/* Foliage layer 2 (top tuft) */}
        <Box ix={-ROOM+0.04} iy={1.82} iz={0.60} w={0.28} d={0.28} h={0.34} ct="#48A452" cr="#349040" cl="#3C9848" opacity={0.88} />

        {/* ── Baseboard trim lines (gold, at z=0.06) ── */}
        <line
          x1={wallCornerBx} y1={iso(-ROOM,-ROOM,0.06)[1]}
          x2={wallRBotRx}   y2={iso( ROOM,-ROOM,0.06)[1]}
          stroke="#C9A84C" strokeWidth="0.8" opacity="0.22"
        />
        <line
          x1={wallCornerBx} y1={iso(-ROOM,-ROOM,0.06)[1]}
          x2={wallLBotLx}   y2={iso(-ROOM, ROOM,0.06)[1]}
          stroke="#C9A84C" strokeWidth="0.8" opacity="0.17"
        />

        {/* ════════════════════════════════════════════════════════════
            FLOOR TILES
        ════════════════════════════════════════════════════════════ */}
        <FloorGrid />

        {/* Ambient glow on floor under table (state-reactive) */}
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
