'use client'

import { useEffect, useState } from 'react'
import { COUNSELORS } from './counselors.config'
import { getCounselorState, COUNSELOR_KEYWORDS } from './chambraStates'
import type { ChambraState } from './chambraStates'
import type { DeliberationState } from '@/lib/deliberation/store'
import { contextBadgeLabel, contextBadgeColor, contextUsagePercent } from '@/lib/deliberation/store'

// ─── Isometric Math ───────────────────────────────────────────────────────────
// Origin (room center), scale factors
const OX = 400, OY = 278
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

/** Screen (sx, sy) → iso (ix, iy) at z=0 — back-projection */
function screenToIso(sx: number, sy: number): [number, number] {
  const u = (sx - OX) / SX  // ix - iy
  const v = (sy - OY) / SY  // ix + iy
  return [(u + v) / 2, (v - u) / 2]
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
const TABLE_H = 0.6   // table top height (raise to center among character bodies)
const TABLE_R = 1.94  // table radius in iso units

// Table ellipse in screen space
const TABLE_RX = TABLE_R * SX * Math.SQRT2
const TABLE_RY = TABLE_R * SY * Math.SQRT2
const [TABLE_CX, TABLE_CY] = iso(0, 0, TABLE_H)

// Seat ring is placed at ground level (OX, OY), independent of TABLE_H.
// This lets the table height be tuned without displacing the characters.
const SEAT_CX = OX
const SEAT_CY = OY

// Per-counselor 3-face colors [top=light, right=mid, left=shadow]
// Light source: top-left → top face brightest, right face medium, left face deep shadow
const CHAR_COLORS: [string, string, string][] = [
  ['#F2D060', '#C8980C', '#6A4C00'],  // Estratégia — gold    (yellow, strong contrast)
  ['#7EC8F0', '#3A88C0', '#0E4070'],  // Finanças   — blue    (clear, trustworthy)
  ['#6AC090', '#2E8050', '#0A4020'],  // Growth     — green
  ['#6A90C8', '#2E58A0', '#0A2858'],  // Produto    — blue-slate
  ['#B0C0D8', '#6880A0', '#283850'],  // Operações  — steel
  ['#D090E8', '#8840B8', '#420868'],  // Marca      — purple  (vibrant, distinctive)
]

// ─── Seat layout ─────────────────────────────────────────────────────────────
// Seats are defined by screen-space angle (0°=right, 90°=down/front, 270°=up/back).
// Iso positions are derived from TABLE_RX/RY + SEAT_MARGIN, so they stay proportional
// to the table size automatically — change TABLE_R and seats follow.
const SEAT_MARGIN = 48  // px beyond table ellipse edge

type SeatConfig = { arm?: 'x' | '-x' | 'x-back' | 'y' | '-y' | 'y-back' | 'diagonal'; eye?: 'x' | 'y' | 'diagonal' | null }

const SEAT_DEFS: { angle: number; ci: number | null; config?: SeatConfig }[] = [
  { angle: 295.7, ci: 0, config: { eye: 'y' } },                         // Estratégia — top (arm auto, eye y)
  { angle: 347.1, ci: 1, config: { arm: 'x' } },                        // Finanças   — top-right
  { angle:  38.6, ci: 2, config: { arm: 'y-back', eye: null } },           // Growth     — braço y-back (±Y faces, mãos apontam -X)
  { angle:  90.0, ci: null },                                            // Founder    — bottom (empty)
  { angle: 141.4, ci: 3, config: { arm: 'x-back', eye: null } },          // Produto    — braço x-back (sides, mãos apontam -Y)
  { angle: 192.9, ci: 5, config: { arm: 'y' } },                        // Marca      — top-left
  { angle: 244.3, ci: 4, config: { arm: 'y', eye: 'x' } },              // Operações  — top-left-up
]

// Derive iso positions from angles — seat ring centered at ground level (SEAT_CX/CY)
const ALL_SEATS = SEAT_DEFS.map(def => {
  const rad = (def.angle * Math.PI) / 180
  const [ix, iy] = screenToIso(
    SEAT_CX + Math.cos(rad) * (TABLE_RX + SEAT_MARGIN),
    SEAT_CY + Math.sin(rad) * (TABLE_RY + SEAT_MARGIN),
  )
  return { ...def, ix, iy, isBack: ix + iy < 0 }
})

const sortedBack  = ALL_SEATS.filter(s =>  s.isBack).sort((a, b) => iso(a.ix, a.iy)[1] - iso(b.ix, b.iy)[1])
const sortedFront = ALL_SEATS.filter(s => !s.isBack).sort((a, b) => iso(a.ix, a.iy)[1] - iso(b.ix, b.iy)[1])

// ─── Sub-components ───────────────────────────────────────────────────────────
function Chair({ ix, iy }: { ix: number; iy: number }) {
  const [sx, sy] = iso(ix, iy, 0)
  const angleDeg = Math.atan2(sy - TABLE_CY, sx - TABLE_CX) * (180 / Math.PI)
  return (
    <g transform={`translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(${(angleDeg + 90).toFixed(1)})`}>
      {/* Seat shadow */}
      <circle r={13} cy={2} fill="rgba(0,0,0,0.20)" />
      {/* Seat — dark navy */}
      <circle r={13} fill="#3D5472" />
      {/* Seat subtle highlight */}
      <circle r={8} cx={-2} cy={-2} fill="#485E80" opacity={0.35} />
      {/* Backrest — two arcs for depth */}
      <path d="M -11 -12 Q 0 -21 11 -12" fill="none" stroke="#2A3D58" strokeWidth={5} strokeLinecap="round" />
      <path d="M -11 -12 Q 0 -21 11 -12" fill="none" stroke="#4A6488" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  )
}

// ─── Discrete facing system ───────────────────────────────────────────────────
// 4 fixed orientations. Each is a STRUCTURAL variant of the model — no SVG rotate.
// Mapping to iso faces:
//   toward-right → front face = +X (right face)  → arms extend in ±X, eyes on +X
//   toward-left  → front face = +Y (left face)   → arms extend in ±Y, eyes on +Y
//   toward-down  → front face = +X (into scene)  → same geometry as toward-right
//   toward-up    → back to viewer                 → no visible eyes
type Facing = 'toward-right' | 'toward-left' | 'toward-down' | 'toward-up'

// Low-poly isometric character — fixed proportions, consistent lighting, NO rotation transforms.
// Light source: top-left → top=bright, right=mid, left=deep shadow.
// arm: 'x'        → braços no eixo X: armL em -X, armR em +X  (mãos apontam +Y = front)
//      '-x'       → espelho de 'x':   armL em +X, armR em -X
//      'x-back'   → Left/Right faces, mãos apontam -Y (back) ← novo
//      'y'        → braços no eixo Y: armL em -Y, armR em +Y
//      '-y'       → espelho de 'y':   armL em +Y, armR em -Y
//      'diagonal' → armL em -X, armR em -Y (simétrico na diagonal)
// eye: 'x'        → olhos na face +X
//      'y'        → olhos na face +Y
//      'diagonal' → um olho em cada face (+X e +Y), perto da quina
//      null       → sem olhos
function IsoCharacter({
  ix, iy, shirt, arm, eye,
}: {
  ix: number; iy: number
  shirt: [string, string, string]
  arm: 'x' | '-x' | 'x-back' | 'y' | '-y' | 'y-back' | 'diagonal'
  eye: 'x' | 'y' | 'diagonal' | null
}) {
  const pants = ['#5A6E88', '#384E68', '#182840'] as [string, string, string]
  const skin  = ['#F8C880', '#D8944A', '#944820'] as [string, string, string]
  const shoes = ['#303840', '#181E28', '#080C14'] as [string, string, string]

  // ── Core body (same for all configs) ─────────────────────────────────
  const torso = { x: ix-0.22, y: iy-0.20, z: 0.28, w: 0.44, d: 0.44, h: 0.58 }
  const legL  = { x: ix-0.20, y: iy-0.02, z: 0.00, w: 0.18, d: 0.18, h: 0.28 }
  const legR  = { x: ix+0.02, y: iy-0.02, z: 0.00, w: 0.18, d: 0.18, h: 0.28 }
  const shoeL = { x: ix-0.20, y: iy+0.10, z: 0.00, w: 0.18, d: 0.14, h: 0.08 }
  const shoeR = { x: ix+0.02, y: iy+0.10, z: 0.00, w: 0.18, d: 0.14, h: 0.08 }
  const head  = { x: ix-0.17, y: iy-0.17, z: 0.92, w: 0.34, d: 0.34, h: 0.36 }
  const hair  = { x: ix-0.17, y: iy-0.17, z: 1.26, w: 0.34, d: 0.34, h: 0.10 }

  // ── Arms: controlled by `arm` prop ───────────────────────────────────
  const armL =
    arm === 'y'        ? { x: ix-0.08, y: iy-0.36, z: 0.54, w: 0.34, d: 0.10, h: 0.18 }  // -Y side
    : arm === '-y'     ? { x: ix-0.08, y: iy+0.22, z: 0.54, w: 0.34, d: 0.10, h: 0.18 }  // +Y side
    : arm === '-x'     ? { x: ix+0.22, y: iy-0.08, z: 0.54, w: 0.10, d: 0.34, h: 0.18 }  // +X side
    : arm === 'x-back' ? { x: ix-0.36, y: iy-0.42, z: 0.54, w: 0.10, d: 0.34, h: 0.18 }  // -X, arm aponta -Y (back)
    : arm === 'y-back' ? { x: ix-0.42, y: iy-0.36, z: 0.54, w: 0.34, d: 0.10, h: 0.18 }  // -Y face, arm aponta -X (back)
    :                    { x: ix-0.36, y: iy-0.08, z: 0.54, w: 0.10, d: 0.34, h: 0.18 }  // -X side (x, diagonal)

  const armR =
    arm === 'y'        ? { x: ix-0.08, y: iy+0.22, z: 0.54, w: 0.34, d: 0.10, h: 0.18 }  // +Y side
    : arm === '-y'     ? { x: ix-0.08, y: iy-0.36, z: 0.54, w: 0.34, d: 0.10, h: 0.18 }  // -Y side
    : arm === '-x'     ? { x: ix-0.36, y: iy-0.08, z: 0.54, w: 0.10, d: 0.34, h: 0.18 }  // -X side
    : arm === 'x-back' ? { x: ix+0.22, y: iy-0.42, z: 0.54, w: 0.10, d: 0.34, h: 0.18 }  // +X, arm aponta -Y (back)
    : arm === 'y-back' ? { x: ix-0.42, y: iy+0.22, z: 0.54, w: 0.34, d: 0.10, h: 0.18 }  // +Y face, arm aponta -X (back)
    : arm === 'diagonal' ? { x: ix-0.08, y: iy-0.36, z: 0.54, w: 0.34, d: 0.10, h: 0.18 }  // -Y (diagonal)
    :                      { x: ix+0.22, y: iy-0.08, z: 0.54, w: 0.10, d: 0.34, h: 0.18 }  // +X side (x)

  // ── Hands ─────────────────────────────────────────────────────────────
  const yAxisArm = arm === 'y' || arm === '-y' || arm === 'diagonal'
  const handL =
    arm === 'x-back' ? { ix: armL.x,        iy: armL.y - 0.08, iz: armL.z, w: armL.w, d: 0.08,   h: 0.10 }  // mão ponta -Y
    : arm === 'y-back' ? { ix: armL.x - 0.08, iy: armL.y,        iz: armL.z, w: 0.08,   d: armL.d, h: 0.10 }  // mão ponta -X
    : yAxisArm ? { ix: armL.x + armL.w, iy: armL.y, iz: armL.z, w: 0.08, d: armL.d, h: 0.10 }
    : { ix: armL.x, iy: armL.y + armL.d, iz: armL.z, w: armL.w, d: 0.08, h: 0.10 }
  const handR =
    arm === 'x-back' ? { ix: armR.x,        iy: armR.y - 0.08, iz: armR.z, w: armR.w, d: 0.08,   h: 0.10 }  // mão ponta -Y
    : arm === 'y-back' ? { ix: armR.x - 0.08, iy: armR.y,        iz: armR.z, w: 0.08,   d: armR.d, h: 0.10 }  // mão ponta -X
    : yAxisArm ? { ix: armR.x + armR.w, iy: armR.y, iz: armR.z, w: 0.08, d: armR.d, h: 0.10 }
    : { ix: armR.x, iy: armR.y + armR.d, iz: armR.z, w: armR.w, d: 0.08, h: 0.10 }

  // ── Eyes: controlados por `eye` prop — independente dos braços ────────
  let eyePos: [[number, number], [number, number]] | null = null
  if (eye === 'x') {
    eyePos = [
      iso(head.x + head.w, head.y + head.d * 0.28, head.z + head.h * 0.62),
      iso(head.x + head.w, head.y + head.d * 0.72, head.z + head.h * 0.62),
    ]
  } else if (eye === 'y') {
    eyePos = [
      iso(head.x + head.w * 0.28, head.y + head.d, head.z + head.h * 0.62),
      iso(head.x + head.w * 0.72, head.y + head.d, head.z + head.h * 0.62),
    ]
  } else if (eye === 'diagonal') {
    // Um olho em cada face perto da quina — ilusão de olhar para a câmera
    eyePos = [
      iso(head.x + head.w,        head.y + head.d * 0.82, head.z + head.h * 0.62),  // face +X, perto da quina
      iso(head.x + head.w * 0.82, head.y + head.d,        head.z + head.h * 0.62),  // face +Y, perto da quina
    ]
  }

  const [gx, gy] = iso(ix, iy, 0)

  return (
    <g>
      {/* Ground shadow — anchors character to floor */}
      <ellipse cx={gx} cy={gy+4} rx={22} ry={10} fill="rgba(0,0,0,0.28)" style={{ filter: 'blur(5px)' }} />
      {/* Legs + shoes */}
      <Box ix={legL.x}  iy={legL.y}  iz={legL.z}  w={legL.w}  d={legL.d}  h={legL.h}  ct={pants[0]} cr={pants[1]} cl={pants[2]} />
      <Box ix={legR.x}  iy={legR.y}  iz={legR.z}  w={legR.w}  d={legR.d}  h={legR.h}  ct={pants[0]} cr={pants[1]} cl={pants[2]} />
      <Box ix={shoeL.x} iy={shoeL.y} iz={shoeL.z} w={shoeL.w} d={shoeL.d} h={shoeL.h} ct={shoes[0]} cr={shoes[1]} cl={shoes[2]} />
      <Box ix={shoeR.x} iy={shoeR.y} iz={shoeR.z} w={shoeR.w} d={shoeR.d} h={shoeR.h} ct={shoes[0]} cr={shoes[1]} cl={shoes[2]} />
      {/* Torso */}
      <Box ix={torso.x} iy={torso.y} iz={torso.z} w={torso.w} d={torso.d} h={torso.h} ct={shirt[0]} cr={shirt[1]} cl={shirt[2]} />
      {/* Arms */}
      <Box ix={armL.x}  iy={armL.y}  iz={armL.z}  w={armL.w}  d={armL.d}  h={armL.h}  ct={shirt[0]} cr={shirt[1]} cl={shirt[2]} />
      <Box ix={armR.x}  iy={armR.y}  iz={armR.z}  w={armR.w}  d={armR.d}  h={armR.h}  ct={shirt[0]} cr={shirt[1]} cl={shirt[2]} />
      {/* Hands */}
      <Box ix={handL.ix} iy={handL.iy} iz={handL.iz} w={handL.w} d={handL.d} h={handL.h} ct={skin[0]} cr={skin[1]} cl={skin[2]} />
      <Box ix={handR.ix} iy={handR.iy} iz={handR.iz} w={handR.w} d={handR.d} h={handR.h} ct={skin[0]} cr={skin[1]} cl={skin[2]} />
      {/* Head + hair */}
      <Box ix={head.x}  iy={head.y}  iz={head.z}  w={head.w}  d={head.d}  h={head.h}  ct={skin[0]} cr={skin[1]} cl={skin[2]} />
      <Box ix={hair.x}  iy={hair.y}  iz={hair.z}  w={hair.w}  d={hair.d}  h={hair.h}  ct="#2A1A0A" cr="#160C04" cl="#0A0402" />
      {/* Eyes — on correct face per facing, no rotation */}
      {eyePos && (
        <>
          <circle cx={eyePos[0][0]} cy={eyePos[0][1]} r={2.2} fill="#1A0804" />
          <circle cx={eyePos[1][0]} cy={eyePos[1][1]} r={2.2} fill="#1A0804" />
          <circle cx={eyePos[0][0] - 0.7} cy={eyePos[0][1] - 0.7} r={0.8} fill="white" opacity={0.90} />
          <circle cx={eyePos[1][0] - 0.7} cy={eyePos[1][1] - 0.7} r={0.8} fill="white" opacity={0.90} />
        </>
      )}
    </g>
  )
}

function CouncilMember({
  ix, iy, ci, state, chambraState, config,
}: { ix: number; iy: number; ci: number; state: string; chambraState: ChambraState; config?: SeatConfig }) {
  const [ct, cr, cl] = CHAR_COLORS[ci]
  const isActive = state === 'active' || state === 'thinking'
  const animClass = state === 'thinking'
    ? 'counselor-thinking'
    : isActive ? 'counselor-active' : `counselor-breathe-${ci % 3}`

  const [lx, ly] = iso(ix, iy, 1.45)

  // Auto-calc facing from screen-space position relative to table center
  const [gx, gy] = iso(ix, iy, 0)
  const dx = TABLE_CX - gx
  const dy = TABLE_CY - gy
  const facing: Facing = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'toward-right' : 'toward-left')
    : (dy > 0 ? 'toward-down'  : 'toward-up')

  // Derive defaults from auto-calc, then apply per-seat overrides
  const defaultArm: 'x' | '-x' | 'x-back' | 'y' | '-y' | 'y-back' | 'diagonal' = facing === 'toward-left' ? 'y' : 'x'
  const defaultEye: 'x' | 'y' | null = (facing === 'toward-right' || facing === 'toward-down') ? 'x'
    : facing === 'toward-left' ? 'y' : null
  const arm = config?.arm ?? defaultArm
  const eye = config?.eye !== undefined ? config.eye : defaultEye

  return (
    <g>
      <g
        className={animClass}
        style={{ animationDelay: `${ci * 0.35}s`, transformOrigin: `${gx.toFixed(1)}px ${gy.toFixed(1)}px` }}
      >
        <IsoCharacter ix={ix} iy={iy} shirt={[ct, cr, cl]} arm={arm} eye={eye} />
      </g>

      {/* Counselor label hidden per UX direction */}
    </g>
  )
}

// ─── Main Chamber ─────────────────────────────────────────────────────────────
export function CuriaChambra({
  state,
  activeCounselorIds,
  deliberation,
}: {
  state: ChambraState
  activeCounselorIds?: Set<string>
  deliberation?: DeliberationState
}) {
  const [kwTick, setKwTick] = useState(0)

  useEffect(() => {
    if (state === 'idle' || state === 'verdict') { setKwTick(0); return }
    const t = setInterval(() => setKwTick(n => n + 1), 3600)
    return () => clearInterval(t)
  }, [state])

  const isActive          = state === 'deliberating' || state === 'receiving'
  const isVerdict         = state === 'verdict'
  const isCounselorsPhase = deliberation?.phase === 'counselors'
  const phaseLabel = deliberation?.phase === 'counselors' ? 'Conselheiros deliberam…'
    : deliberation?.phase === 'synthesis' ? 'Sintetizando parecer…'
    : null

  const stateLabel: Record<ChambraState, string> = {
    idle:         'Conselho disponível',
    receiving:    'Questão recebida',
    deliberating: 'Deliberando…',
    verdict:      'Parecer emitido',
  }

  return (
    <div className="curia-chamber-wrapper">
      <svg viewBox="170 60 460 360" className="curia-chamber-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Warm wood surface gradient — matches reference */}
          <radialGradient id="mt-grad" cx="40%" cy="36%" r="62%">
            <stop offset="0%"   stopColor="#D4BC8C" />
            <stop offset="60%"  stopColor="#C4A870" />
            <stop offset="100%" stopColor="#B09050" />
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
        {sortedBack.map(({ ix: six, iy: siy, ci, config: cfg }) => {
          if (ci === null) {
            return <g key="founder-back"><Chair ix={six} iy={siy} /></g>
          }
          const counselorId = COUNSELORS[ci].id
          const csState = getCounselorState(counselorId, state, activeCounselorIds)
          const isActiveC = activeCounselorIds?.has(counselorId) ?? false
          const brief = deliberation?.counselorBriefs.get(counselorId)
          const showChip = isCounselorsPhase && (isActiveC || !!brief)
          const [chipX, chipY] = iso(six, siy, 1.95)
          const counselorColor = COUNSELORS[ci].color

          return (
            <g key={ci}>
              <Chair ix={six} iy={siy} />
              <CouncilMember ix={six} iy={siy} ci={ci} state={csState} chambraState={state} config={cfg} />
              {showChip && (() => {
                const kws = COUNSELOR_KEYWORDS[counselorId] ?? []
                const chipText = brief
                  ? brief.slice(0, 34) + (brief.length > 34 ? '…' : '')
                  : (kws[kwTick % kws.length] ?? '')
                const chipW = Math.max(chipText.length * 5.0 + 14, 36)
                return (
                  <g className={brief ? 'counselor-brief-chip' : 'keyword-chip'}>
                    <rect
                      x={chipX - chipW / 2} y={chipY - 9}
                      width={chipW} height={13}
                      rx="6.5" fill="#F5F0EC"
                      stroke={counselorColor} strokeWidth="0.8" opacity="0.96"
                    />
                    <text
                      x={chipX} y={chipY}
                      textAnchor="middle" fontSize="7"
                      fill={counselorColor} opacity="0.95"
                      fontFamily="Inter, ui-sans-serif, sans-serif"
                      letterSpacing="0.04em"
                    >
                      {chipText}
                    </text>
                  </g>
                )
              })()}

              {/* Speech bubble with fake-text lines */}
              {state !== 'idle' && state !== 'verdict' && (() => {
                const [bx, by] = iso(six, siy, 2.2)
                const w = 28; const h = 14; const rx = 7
                const ty = by - h - 8  // rect top-y
                return (
                  <g className="curia-speech-bubble" opacity={isActiveC ? 0.85 : 0.45}>
                    <rect x={bx - w/2} y={ty} width={w} height={h} rx={rx} ry={rx} fill="#FFFFFF" stroke={counselorColor} strokeWidth="0.7" />
                    <path d={`M ${bx - 3} ${by - 8} l 3 5 l 3 -5 z`} fill="#FFFFFF" stroke={counselorColor} strokeWidth="0.7" strokeLinejoin="round" />
                    {/* Risquinhos — fake text lines */}
                    <line x1={bx - 9} y1={ty + 3.5} x2={bx + 7} y2={ty + 3.5} stroke={counselorColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
                    <line x1={bx - 9} y1={ty + 8.5} x2={bx + 2} y2={ty + 8.5} stroke={counselorColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.30" />
                  </g>
                )
              })()}
            </g>
          )
        })}

        {/* ════════════════════════════════════════════════════════════
            ROUND TABLE
        ════════════════════════════════════════════════════════════ */}
        {/* ── Drop shadow ── */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY + 14}
          rx={TABLE_RX + 6} ry={TABLE_RY + 4}
          fill="rgba(0,0,0,0.18)"
          style={{ filter: 'blur(6px)' }}
        />
        {/* ── Cylinder rim — bottom face (darkest) ── */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY + 9}
          rx={TABLE_RX} ry={TABLE_RY}
          fill="#7A5A28"
        />
        {/* ── Cylinder rim — top band (mid-tone wood) ── */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY + 4}
          rx={TABLE_RX} ry={TABLE_RY}
          fill="#A07838"
        />
        {/* ── Table surface (top face) ── */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY}
          rx={TABLE_RX} ry={TABLE_RY}
          fill="url(#mt-grad)"
          stroke="#9A7840"
          strokeWidth="0.8"
        />
        {/* ── State glow — centre of table (reactive) ── */}
        <ellipse
          cx={TABLE_CX} cy={TABLE_CY}
          rx={isVerdict ? 62 : isActive ? 44 : 20}
          ry={isVerdict ? 34 : isActive ? 24 : 11}
          fill="#C9A84C"
          opacity={isVerdict ? 0.22 : isActive ? 0.10 : 0.02}
          style={{ filter: 'blur(8px)', transition: 'all 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          className={isActive ? 'table-center-pulse' : ''}
        />

        {/* Floating keywords during synthesis (suppressed during counselors phase) */}
        {state === 'deliberating' && !isCounselorsPhase && (() => {
          const SYNTHESIS_KW = ['posicionamento','churn','LTV/CAC','flywheel','unit economics','crescimento','estratégia','prioridade','gargalo','momentum']
          return Array.from({ length: Math.min(kwTick + 1, 5) }, (_, i) => {
            const kw = SYNTHESIS_KW[(kwTick - i + SYNTHESIS_KW.length * 10) % SYNTHESIS_KW.length]
            const kwx = TABLE_CX + (i % 3 - 1) * 58
            const kwy = TABLE_CY - 14 - Math.floor(i / 3) * 20
            return (
              <g key={`${i}-${kw}`} className="keyword-chip" style={{ animationDelay: `${i * 0.12}s` }}>
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
          })
        })()}

        {/* ════════════════════════════════════════════════════════════
            FRONT CHARACTERS + CHAIRS
        ════════════════════════════════════════════════════════════ */}
        {sortedFront.map(({ ix: six, iy: siy, ci, config: cfg }) => {
          if (ci === null) {
            return <g key="founder"><Chair ix={six} iy={siy} /></g>
          }
          const csState = getCounselorState(COUNSELORS[ci].id, state, activeCounselorIds)
          return (
            <g key={ci}>
              <Chair ix={six} iy={siy} />
              <CouncilMember ix={six} iy={siy} ci={ci} state={csState} chambraState={state} config={cfg} />
              {state !== 'idle' && state !== 'verdict' && (() => {
                const [bx, by] = iso(six, siy, 2.2)
                const w = 28; const h = 14; const rx = 7
                const ty = by - h - 8
                const color = COUNSELORS[ci].color
                return (
                  <g className="curia-speech-bubble" opacity={0.8}>
                    <rect x={bx - w/2} y={ty} width={w} height={h} rx={rx} ry={rx} fill="#FFFFFF" stroke={color} strokeWidth="0.7" />
                    <path d={`M ${bx - 3} ${by - 8} l 3 5 l 3 -5 z`} fill="#FFFFFF" stroke={color} strokeWidth="0.7" strokeLinejoin="round" />
                    {/* Risquinhos — fake text lines */}
                    <line x1={bx - 9} y1={ty + 3.5} x2={bx + 7} y2={ty + 3.5} stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
                    <line x1={bx - 9} y1={ty + 8.5} x2={bx + 2} y2={ty + 8.5} stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.30" />
                  </g>
                )
              })()}
            </g>
          )
        })}


      </svg>

      {/* Phase label hidden per UX direction */}

      {/* ── Token budget badge (AppState pattern: estado observável visível) ── */}
      {deliberation && (() => {
        const label = contextBadgeLabel(deliberation)
        if (!label) return null
        const pct   = contextUsagePercent(deliberation)
        const color = contextBadgeColor(pct)
        return (
          <div className="curia-context-badge" style={{ '--badge-color': color } as React.CSSProperties}>
            <span className="curia-context-bar" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
            <span className="curia-context-label">{label}</span>
          </div>
        )
      })()}
    </div>
  )
}
