export interface CounselorConfig {
  id: string
  label: string
  color: string
}

export const COUNSELORS: CounselorConfig[] = [
  { id: 'strategy',   label: 'Estratégia', color: '#1E2A44' },
  { id: 'finance',    label: 'Finanças',   color: '#6B2838' },
  { id: 'growth',     label: 'Growth',     color: '#3A4A35' },
  { id: 'product',    label: 'Produto',    color: '#2E3540' },
  { id: 'operations', label: 'Operações',  color: '#5A3E2B' },
  { id: 'brand',      label: 'Marca',      color: '#8B6F47' },
]
