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
