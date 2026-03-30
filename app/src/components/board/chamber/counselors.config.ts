export interface CounselorConfig {
  id: string
  label: string
  color: string
}

export const COUNSELORS: CounselorConfig[] = [
  { id: 'strategy',   label: 'Estratégia', color: '#C9A84C' },
  { id: 'finance',    label: 'Finanças',   color: '#A8B5C0' },
  { id: 'growth',     label: 'Growth',     color: '#4A9B6F' },
  { id: 'product',    label: 'Produto',    color: '#4A6FA5' },
  { id: 'operations', label: 'Operações',  color: '#8B9BB4' },
  { id: 'brand',      label: 'Marca',      color: '#9B6BB4' },
]

// Positions in a U-shaped arc (degrees). 6 points from 210° to 330°.
// SVG viewBox 0 0 800 440.  Table back edge ≈ y=270, table center y=338.
// Arc center (400, 305), radiusX=240, radiusY=70 — counselors sit just behind table edge.
export const COUNSELOR_POSITIONS = COUNSELORS.map((c, i) => {
  const angleDeg = 210 + i * 24
  const rad = (angleDeg * Math.PI) / 180
  const x = 400 + Math.cos(rad) * 240
  const y = 305 + Math.sin(rad) * 70
  // Scale: y range 237–270 → scale 0.83–1.0 (depth perspective)
  const minY = 237, maxY = 270
  const scale = 0.83 + ((y - minY) / (maxY - minY)) * 0.17
  return { ...c, x: Math.round(x), y: Math.round(y), scale: +Math.min(1, Math.max(0.83, scale)).toFixed(2) }
})
