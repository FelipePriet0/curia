'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { CuriaChambra } from '@/components/board/chamber/CuriaChambra'
import { getInitialDeliberationState } from '@/lib/deliberation/store'
import type { ChambraState } from '@/components/board/chamber/chambraStates'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  company_name: string; industry: string; team_size: string
  founded_period: string; capital_stage: string
  business_type: string; business_model: string; monetization: string
  product_description: string; average_ticket: string
  mrr: string; churn_rate: string; cac: string; ltv: string
  monthly_revenue: string; gross_margin: string; max_capacity: string
  gmv: string; take_rate: string; marketplace_weak_side: string
  active_customers: string; icp_defined: string; icp_description: string
  acquisition_channel: string; main_bottleneck: string; main_bottleneck_detail: string
}

interface PriorityItem {
  rank: number; problem: string; detail: string
  framework: string; urgency: 'critical' | 'high' | 'medium'
}

interface Diagnosis {
  stage: string; stage_reason: string
  diagnostic_summary: string; priority_ladder: PriorityItem[]
}

type QType = 'text' | 'textarea' | 'number' | 'chips' | 'multi-chips'

interface Question {
  id: string
  key: keyof FormData
  message: string
  type: QType
  chips?: { label: string; value: string }[]
  optional?: boolean
  prefix?: string
  suffix?: string
  placeholder?: string
  skipIf?: (form: FormData) => boolean
}

interface ChatMsg {
  id: string
  from: 'curia' | 'user'
  text: string
  isDiagnosis?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INIT: FormData = {
  company_name: '', industry: '', team_size: '', founded_period: '', capital_stage: '',
  business_type: '', business_model: '', monetization: '', product_description: '', average_ticket: '',
  mrr: '', churn_rate: '', cac: '', ltv: '',
  monthly_revenue: '', gross_margin: '', max_capacity: '',
  gmv: '', take_rate: '', marketplace_weak_side: '',
  active_customers: '', icp_defined: '', icp_description: '',
  acquisition_channel: '', main_bottleneck: '', main_bottleneck_detail: '',
}

const QUESTIONS: Question[] = [
  {
    id: 'company_name', key: 'company_name',
    message: 'Qual é o nome da empresa?',
    type: 'text', placeholder: 'Ex: Curia, Nubank, Stone...',
  },
  {
    id: 'industry', key: 'industry',
    message: 'Em qual setor você atua?',
    type: 'chips',
    chips: [
      { label: 'Tech / SaaS', value: 'tech' },
      { label: 'Varejo', value: 'varejo' },
      { label: 'Serviços', value: 'servicos' },
      { label: 'Saúde', value: 'saude' },
      { label: 'Educação', value: 'educacao' },
      { label: 'Financeiro', value: 'financeiro' },
      { label: 'Agro', value: 'agro' },
      { label: 'Indústria', value: 'industria' },
      { label: 'Outro', value: 'outro' },
    ],
  },
  {
    id: 'business_type', key: 'business_type',
    message: 'Qual é o tipo de produto ou serviço?',
    type: 'chips',
    chips: [
      { label: 'SaaS', value: 'saas' },
      { label: 'Produto físico', value: 'physical_product' },
      { label: 'Serviço', value: 'service' },
      { label: 'Marketplace', value: 'marketplace' },
      { label: 'App', value: 'app' },
      { label: 'Outro', value: 'other' },
    ],
  },
  {
    id: 'product_description', key: 'product_description',
    message: 'Me venda o produto em 30 segundos — o que é, pra quem e por que pagam?',
    type: 'textarea',
    placeholder: 'Ex: A Curia é um board consultivo de IA para founders. Por R$99/mês você tem 6 conselheiros...',
  },
  {
    id: 'average_ticket', key: 'average_ticket',
    message: 'Qual é o ticket médio?',
    type: 'number', prefix: 'R$', optional: true, placeholder: '299',
  },
  // SaaS / App
  { id: 'mrr', key: 'mrr', message: 'Qual é o MRR atual?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  { id: 'churn_rate', key: 'churn_rate', message: 'Churn mensal?', type: 'number', suffix: '%', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  { id: 'cac', key: 'cac', message: 'CAC?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  { id: 'ltv', key: 'ltv', message: 'LTV?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  // Transactional
  { id: 'monthly_revenue_t', key: 'monthly_revenue', message: 'Faturamento mensal?', type: 'number', prefix: 'R$', optional: true, skipIf: f => ['saas', 'app', 'marketplace', 'service'].includes(f.business_type) },
  { id: 'gross_margin', key: 'gross_margin', message: 'Margem bruta?', type: 'number', suffix: '%', optional: true, skipIf: f => ['saas', 'app', 'marketplace', 'service'].includes(f.business_type) },
  // Service
  { id: 'monthly_revenue_s', key: 'monthly_revenue', message: 'Faturamento mensal?', type: 'number', prefix: 'R$', optional: true, skipIf: f => f.business_type !== 'service' },
  { id: 'max_capacity', key: 'max_capacity', message: 'Capacidade máxima por mês (clientes ou projetos)?', type: 'number', optional: true, skipIf: f => f.business_type !== 'service' },
  // Marketplace
  { id: 'gmv', key: 'gmv', message: 'GMV mensal?', type: 'number', prefix: 'R$', optional: true, skipIf: f => f.business_type !== 'marketplace' },
  { id: 'take_rate', key: 'take_rate', message: 'Take rate?', type: 'number', suffix: '%', optional: true, skipIf: f => f.business_type !== 'marketplace' },
  {
    id: 'marketplace_weak_side', key: 'marketplace_weak_side',
    message: 'Qual é o lado mais fraco do marketplace?',
    type: 'chips', optional: true, skipIf: f => f.business_type !== 'marketplace',
    chips: [
      { label: 'Supply (oferta)', value: 'supply' },
      { label: 'Demand (demanda)', value: 'demand' },
    ],
  },
  // Traction & ICP
  { id: 'active_customers', key: 'active_customers', message: 'Quantos clientes ou usuários ativos?', type: 'number', optional: true, placeholder: '45' },
  {
    id: 'icp_defined', key: 'icp_defined',
    message: 'Você tem ICP definido?',
    type: 'chips',
    chips: [
      { label: 'Sim, tenho claro', value: 'yes' },
      { label: 'Ainda não', value: 'no' },
    ],
  },
  {
    id: 'icp_description', key: 'icp_description',
    message: 'Descreva seu ICP.',
    type: 'textarea', optional: true, skipIf: f => f.icp_defined !== 'yes',
    placeholder: 'Ex: Founders de SaaS B2B com 5–50 clientes, faturando entre R$20k e R$100k MRR...',
  },
  {
    id: 'acquisition_channel', key: 'acquisition_channel',
    message: 'Principal canal de aquisição?',
    type: 'chips',
    chips: [
      { label: 'Orgânico / SEO', value: 'organic' },
      { label: 'Anúncios pagos', value: 'paid_ads' },
      { label: 'Indicação / WOM', value: 'referral' },
      { label: 'Outbound / Vendas', value: 'outbound' },
      { label: 'Parcerias', value: 'partnerships' },
      { label: 'Produto-led (PLG)', value: 'plg' },
    ],
  },
  {
    id: 'main_bottleneck', key: 'main_bottleneck',
    message: 'Quais são os maiores gargalos hoje? Pode selecionar mais de um.',
    type: 'multi-chips',
    chips: [
      { label: 'Aquisição de clientes', value: 'acquisition' },
      { label: 'Retenção / churn', value: 'retention' },
      { label: 'Produto / PMF', value: 'product_pmf' },
      { label: 'Capital / runway', value: 'capital' },
      { label: 'Time / operação', value: 'team_ops' },
      { label: 'Marca / posicionamento', value: 'brand' },
    ],
  },
  {
    id: 'main_bottleneck_detail', key: 'main_bottleneck_detail',
    message: 'Quer detalhar um pouco mais?',
    type: 'textarea', optional: true,
    placeholder: 'Ex: Temos produto bom mas não conseguimos explicar para o cliente certo...',
  },
]

const STAGE_PT: Record<string, string> = {
  pre_revenue: 'Pré-Receita', early_traction: 'Tração Inicial',
  growth: 'Crescimento', scale: 'Escala',
}

const STAGE_CLS: Record<string, string> = {
  pre_revenue: 'bg-purple-100 text-purple-700',
  early_traction: 'bg-[#FF6F1E]/10 text-[#FF6F1E]',
  growth: 'bg-emerald-100 text-emerald-700',
  scale: 'bg-blue-100 text-blue-700',
}

const URGENCY: Record<string, { label: string; cls: string }> = {
  critical: { label: 'Crítico', cls: 'bg-red-50 text-red-600 border border-red-200' },
  high:     { label: 'Alta',    cls: 'bg-orange-50 text-[#FF6F1E] border border-orange-200' },
  medium:   { label: 'Média',   cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
}

const LOADING_MSGS = [
  'Analisando a estrutura do negócio...',
  'Mapeando métricas financeiras...',
  'Identificando gargalos críticos...',
  'Definindo o estágio da empresa...',
  'Montando a escada de prioridade...',
]

const EMPTY_DELIBERATION = getInitialDeliberationState()
const EMPTY_COUNSELORS = new Set<string>()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findNextIdx(from: number, form: FormData): number | null {
  for (let i = from + 1; i < QUESTIONS.length; i++) {
    if (!QUESTIONS[i].skipIf?.(form)) return i
  }
  return null
}

function getChipLabel(q: Question, value: string): string {
  return q.chips?.find(c => c.value === value)?.label ?? value
}

function formatAnswer(q: Question, value: string): string {
  if (!value) return '—'
  if (q.type === 'number') return `${q.prefix ?? ''}${value}${q.suffix ?? ''}`
  if (q.type === 'chips') return getChipLabel(q, value)
  if (q.type === 'multi-chips') return value.split(',').map(v => getChipLabel(q, v)).join(', ')
  return value
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DiagnosisCard({ diagnosis }: { diagnosis: Diagnosis }) {
  const stageCls = STAGE_CLS[diagnosis.stage] ?? 'bg-gray-100 text-gray-700'
  const stageLabel = STAGE_PT[diagnosis.stage] ?? diagnosis.stage

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-[#2B1A07]/10 bg-[#FDFBF9] p-5">
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${stageCls}`}>
          {stageLabel}
        </span>
        <p className="mt-2 font-curia-serif text-xs italic leading-relaxed text-[#2B1A07]/60">
          {diagnosis.stage_reason}
        </p>
      </div>
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2B1A07]/40">Diagnóstico</p>
        <p className="font-curia-serif text-sm leading-relaxed text-[#2B1A07]/80">{diagnosis.diagnostic_summary}</p>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2B1A07]/40">Escada de Prioridade</p>
        <div className="space-y-2.5">
          {diagnosis.priority_ladder.map(item => {
            const u = URGENCY[item.urgency] ?? URGENCY.medium
            return (
              <div key={item.rank} className="flex gap-3 rounded-xl border border-[#2B1A07]/8 bg-white p-3.5">
                <span className="shrink-0 pt-0.5 font-curia-rounded text-xl leading-none text-[#2B1A07]/15">
                  {String(item.rank).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-curia-serif text-sm font-semibold text-[#2B1A07]">{item.problem}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.cls}`}>{u.label}</span>
                  </div>
                  <p className="mt-1 font-curia-serif text-xs leading-relaxed text-[#2B1A07]/60">{item.detail}</p>
                  <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[#2B1A07]/35">{item.framework}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, diagnosis }: { msg: ChatMsg; diagnosis?: Diagnosis | null }) {
  if (msg.from === 'curia') {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2B1A07]">
          <span className="font-curia-rounded text-xs text-white">C</span>
        </div>
        <div className="flex-1 max-w-[85%]">
          <div className="rounded-2xl rounded-tl-sm bg-white border border-[#2B1A07]/10 px-4 py-3 shadow-sm">
            <p className="council-textarea text-sm leading-relaxed text-[#2B1A07]" style={{ minHeight: 'auto', maxHeight: 'none', overflow: 'visible' }}>
              {msg.text}
            </p>
          </div>
          {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#2B1A07] px-4 py-3 shadow-sm">
        <p className="council-textarea text-sm leading-relaxed text-white" style={{ minHeight: 'auto', maxHeight: 'none', overflow: 'visible' }}>
          {msg.text}
        </p>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2B1A07]">
        <span className="font-curia-rounded text-xs text-white">C</span>
      </div>
      <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-white border border-[#2B1A07]/10 px-4 py-3.5 shadow-sm">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#2B1A07]/35 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

interface InputAreaProps {
  question: Question
  inputValue: string
  multiSel: string[]
  onInputChange: (v: string) => void
  onMultiToggle: (v: string) => void
  onChipClick: (value: string, label: string) => void
  onMultiConfirm: () => void
  onTextSubmit: () => void
  onSkip: () => void
}

function OnboardingInput({
  question, inputValue, multiSel,
  onInputChange, onMultiToggle, onChipClick, onMultiConfirm, onTextSubmit, onSkip,
}: InputAreaProps) {
  const isChipType = question.type === 'chips' || question.type === 'multi-chips'
  const isTextType = !isChipType

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onTextSubmit()
    }
  }

  return (
    <div className="border-t border-[hsl(var(--border))] bg-[#FDFBF9] px-4 pb-5 pt-3">
      <div className="council-input-home-wrap">

        {/* Chips row */}
        {isChipType && (
          <div className="mb-3 flex flex-wrap gap-2">
            {question.chips?.map(chip => {
              const isActive = question.type === 'multi-chips' && multiSel.includes(chip.value)
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() =>
                    question.type === 'chips'
                      ? onChipClick(chip.value, chip.label)
                      : onMultiToggle(chip.value)
                  }
                  className={cn(
                    'rounded-full border px-4 py-1.5 font-curia-serif text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[#2B1A07] text-white border-[#2B1A07]'
                      : 'bg-white border-[#2B1A07]/20 text-[#2B1A07] hover:border-[#2B1A07]/50'
                  )}
                >
                  {chip.label}
                </button>
              )
            })}
            {question.optional && question.type === 'chips' && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border border-[#2B1A07]/10 px-4 py-1.5 font-curia-serif text-sm text-[#2B1A07]/40 transition-all hover:border-[#2B1A07]/25 hover:text-[#2B1A07]/60"
              >
                Pular →
              </button>
            )}
          </div>
        )}

        {/* Input box — matches council-input-box exactly */}
        <div className="council-input-box">
          {isChipType ? (
            <span className="council-textarea select-none text-sm" style={{ minHeight: 'auto', maxHeight: 'none', overflow: 'visible', fontStyle: 'italic', opacity: 0.3 }}>
              Selecione uma opção acima...
            </span>
          ) : question.type === 'textarea' ? (
            <textarea
              autoFocus
              rows={2}
              value={inputValue}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={question.placeholder ?? ''}
              className="council-textarea council-textarea-home"
              style={{ minHeight: '64px' }}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              {question.prefix && (
                <span className="shrink-0 font-curia-serif text-sm text-[#2B1A07]/50">{question.prefix}</span>
              )}
              <input
                autoFocus
                type="number"
                value={inputValue}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={question.placeholder ?? '0'}
                className="flex-1 bg-transparent border-0 outline-none font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35"
                style={{ minHeight: '24px' }}
              />
              {question.suffix && (
                <span className="shrink-0 font-curia-serif text-sm text-[#2B1A07]/50">{question.suffix}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="council-input-footer">
            <div className="council-input-tools">
              <span className="council-model-badge">
                {question.optional ? 'Opcional' : 'Obrigatório'}
              </span>
            </div>

            {question.type === 'multi-chips' ? (
              <button
                type="button"
                onClick={onMultiConfirm}
                disabled={multiSel.length === 0}
                className="council-send-round"
                aria-label="Confirmar seleção"
              >
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            ) : isTextType ? (
              <button
                type="button"
                onClick={onTextSubmit}
                disabled={!inputValue.trim()}
                className="council-send-round"
                aria-label="Enviar"
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Skip link for optional text/number questions */}
        {isTextType && question.optional && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={onSkip}
              className="font-curia-serif text-xs text-[#2B1A07]/35 transition-colors hover:text-[#2B1A07]/55"
            >
              Pular esta pergunta →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INIT)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [qIdx, setQIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'init' | 'onboarding' | 'submitting' | 'done' | 'error'>('init')
  const [typing, setTyping] = useState(false)
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [multiSel, setMultiSel] = useState<string[]>([])
  const [submitForm, setSubmitForm] = useState<FormData | null>(null)
  const [firstName, setFirstName] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentQ = qIdx !== null ? QUESTIONS[qIdx] : null

  // Derive ChambraState from phase + typing
  const chambraState: ChambraState =
    phase === 'submitting'                          ? 'deliberating'
    : phase === 'done'                              ? 'verdict'
    : (phase === 'onboarding' && typing)            ? 'receiving'
    : 'idle'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing, phase])

  useEffect(() => {
    if (phase !== 'submitting') return
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1600)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      // Extract first name
      const full = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? null
      setFirstName(full ? full.split(' ')[0] : null)

      const { data: company } = await supabase
        .from('companies')
        .select('company_name, industry, team_size, founded_period, capital_stage, business_type, business_model, monetization, product_description, average_ticket, mrr, churn_rate, cac, ltv, monthly_revenue, gross_margin, max_capacity, gmv, take_rate, marketplace_weak_side, active_customers, icp_defined, icp_description, acquisition_channel, main_bottleneck, main_bottleneck_detail')
        .eq('user_id', user.id)
        .maybeSingle()

      const prefilled: FormData = company ? {
        company_name:           company.company_name ?? '',
        industry:               company.industry ?? '',
        team_size:              company.team_size ?? '',
        founded_period:         company.founded_period ?? '',
        capital_stage:          company.capital_stage ?? '',
        business_type:          company.business_type ?? '',
        business_model:         company.business_model ?? '',
        monetization:           company.monetization ?? '',
        product_description:    company.product_description ?? '',
        average_ticket:         company.average_ticket != null ? String(company.average_ticket) : '',
        mrr:                    company.mrr != null ? String(company.mrr) : '',
        churn_rate:             company.churn_rate != null ? String(company.churn_rate) : '',
        cac:                    company.cac != null ? String(company.cac) : '',
        ltv:                    company.ltv != null ? String(company.ltv) : '',
        monthly_revenue:        company.monthly_revenue != null ? String(company.monthly_revenue) : '',
        gross_margin:           company.gross_margin != null ? String(company.gross_margin) : '',
        max_capacity:           company.max_capacity != null ? String(company.max_capacity) : '',
        gmv:                    company.gmv != null ? String(company.gmv) : '',
        take_rate:              company.take_rate != null ? String(company.take_rate) : '',
        marketplace_weak_side:  company.marketplace_weak_side ?? '',
        active_customers:       company.active_customers != null ? String(company.active_customers) : '',
        icp_defined:            company.icp_defined === true ? 'yes' : company.icp_defined === false && company.acquisition_channel ? 'no' : '',
        icp_description:        company.icp_description ?? '',
        acquisition_channel:    company.acquisition_channel ?? '',
        main_bottleneck:        company.main_bottleneck ?? '',
        main_bottleneck_detail: company.main_bottleneck_detail ?? '',
      } : { ...INIT }

      setForm(prefilled)
      setPhase('onboarding')
      setMsgs([{
        id: crypto.randomUUID(),
        from: 'curia',
        text: 'Olá! Vou fazer algumas perguntas rápidas para montar o seu Board.',
      }])

      setTimeout(() => {
        setMsgs(prev => [...prev, { id: crypto.randomUUID(), from: 'curia', text: QUESTIONS[0].message }])
        setQIdx(0)
        if (prefilled.company_name) setInputValue(prefilled.company_name)
      }, 700)
    })
  }, [])

  useEffect(() => {
    if (!submitForm) return
    runSubmit(submitForm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitForm])

  function addMsg(from: ChatMsg['from'], text: string, isDiagnosis?: boolean) {
    setMsgs(prev => [...prev, { id: crypto.randomUUID(), from, text, isDiagnosis }])
  }

  function advanceFrom(idx: number, updatedForm: FormData) {
    const nextIdx = findNextIdx(idx, updatedForm)
    if (nextIdx === null) {
      setTyping(false)
      setSubmitForm(updatedForm)
      return
    }
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const nextQ = QUESTIONS[nextIdx]
      addMsg('curia', nextQ.message)
      setQIdx(nextIdx)
      setInputValue('')
      setMultiSel([])
      const existing = updatedForm[nextQ.key]
      if (existing && nextQ.type !== 'chips') setInputValue(existing)
      if (nextQ.type === 'multi-chips' && existing) setMultiSel(existing.split(',').filter(Boolean))
    }, 650)
  }

  function commitAnswer(value: string, display: string) {
    if (qIdx === null) return
    const updatedForm = { ...form, [QUESTIONS[qIdx].key]: value }
    setForm(updatedForm)
    addMsg('user', display || '—')
    advanceFrom(qIdx, updatedForm)
  }

  function handleChipClick(value: string, label: string) { commitAnswer(value, label) }

  function handleMultiConfirm() {
    if (!currentQ || multiSel.length === 0) return
    const value = multiSel.join(',')
    const display = multiSel.map(v => getChipLabel(currentQ, v)).join(', ')
    commitAnswer(value, display)
  }

  function handleTextSubmit() {
    if (!currentQ || !inputValue.trim()) return
    commitAnswer(inputValue.trim(), formatAnswer(currentQ, inputValue.trim()))
    setInputValue('')
  }

  function handleSkip() {
    if (qIdx === null) return
    addMsg('user', '—')
    advanceFrom(qIdx, form)
  }

  async function runSubmit(finalForm: FormData) {
    setPhase('submitting')
    try {
      const payload = {
        ...finalForm,
        average_ticket:   finalForm.average_ticket   ? Number(finalForm.average_ticket)   : undefined,
        mrr:              finalForm.mrr               ? Number(finalForm.mrr)               : undefined,
        churn_rate:       finalForm.churn_rate        ? Number(finalForm.churn_rate)        : undefined,
        cac:              finalForm.cac               ? Number(finalForm.cac)               : undefined,
        ltv:              finalForm.ltv               ? Number(finalForm.ltv)               : undefined,
        monthly_revenue:  finalForm.monthly_revenue   ? Number(finalForm.monthly_revenue)   : undefined,
        gross_margin:     finalForm.gross_margin      ? Number(finalForm.gross_margin)      : undefined,
        max_capacity:     finalForm.max_capacity      ? Number(finalForm.max_capacity)      : undefined,
        gmv:              finalForm.gmv               ? Number(finalForm.gmv)               : undefined,
        take_rate:        finalForm.take_rate         ? Number(finalForm.take_rate)         : undefined,
        active_customers: finalForm.active_customers  ? Number(finalForm.active_customers)  : undefined,
        icp_defined:      finalForm.icp_defined === 'yes',
      }
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erro ao processar diagnóstico')
      const data = await res.json()

      const supabase = createClient()
      await supabase.auth.refreshSession()

      setDiagnosis(data)
      setPhase('done')
      addMsg('curia', 'Diagnóstico pronto. Aqui está o panorama da sua empresa:', true)
    } catch {
      setPhase('error')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (phase === 'init') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#FDFBF9' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2B1A07]">
          <span className="font-curia-rounded text-lg text-white">C</span>
        </div>
      </div>
    )
  }

  // Câmara visível: enquanto a Curia "pensa" (typing), ao submeter, ao mostrar diagnóstico,
  // ou no momento inicial antes da primeira pergunta aparecer (qIdx === null).
  // Câmara oculta: enquanto o usuário está respondendo uma pergunta.
  const showChamber =
    phase === 'submitting' ||
    phase === 'done'       ||
    (phase === 'onboarding' && (typing || qIdx === null))

  // Altura: 38vh no estado inicial (sem perguntas ainda), 28vh depois
  const chamberHeight = qIdx === null ? '38vh' : '28vh'

  return (
    <div className="flex h-screen flex-col" style={{ background: '#FDFBF9' }}>

      {/* ── Câmara isométrica — condicional ── */}
      {showChamber && (
        <div className="relative w-full shrink-0" style={{ height: chamberHeight }}>
          {/* Título acima da câmara */}
          {phase === 'done' ? (
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 md:-top-3 z-10">
              <span className="font-curia-script text-[#FF6F1E] text-2xl md:text-4xl leading-none">
                Board pronto
              </span>
            </div>
          ) : firstName && phase === 'onboarding' ? (
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 md:-top-3 z-10">
              <span className="font-curia-script text-[#FF6F1E] text-2xl md:text-4xl leading-none">
                Olá, {firstName}
              </span>
            </div>
          ) : null}

          <CuriaChambra
            state={chambraState}
            activeCounselorIds={EMPTY_COUNSELORS}
            deliberation={EMPTY_DELIBERATION}
          />
        </div>
      )}

      {/* ── Área de mensagens ── */}
      <div className="flex-1 overflow-y-auto">
        {phase === 'submitting' ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-[#FF6F1E] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="font-curia-serif text-sm text-[#2B1A07]/60 transition-all duration-500">
              {LOADING_MSGS[loadingMsgIdx]}
            </p>
          </div>
        ) : phase === 'error' ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-curia-serif text-sm text-[#2B1A07]/60">
              Algo deu errado ao processar o diagnóstico.
            </p>
            <button
              onClick={() => submitForm && runSubmit(submitForm)}
              className="rounded-xl border border-[#2B1A07]/15 bg-white px-5 py-2.5 font-curia-serif text-sm text-[#2B1A07] shadow-sm transition-all hover:border-[#2B1A07]/30"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
            {msgs.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                diagnosis={msg.isDiagnosis ? diagnosis : undefined}
              />
            ))}
            {typing && <TypingDots />}
            {phase === 'done' && diagnosis && (
              <div className="flex justify-center pb-4 pt-2">
                <button
                  onClick={() => router.push('/board')}
                  className="flex items-center gap-2 rounded-xl bg-[#FF6F1E] px-6 py-3 font-curia-serif text-sm font-semibold text-[#2B1A07] shadow-sm transition-opacity hover:opacity-90 active:scale-95"
                >
                  Entrar no Board <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bloqueado — só aparece quando câmara está oculta ── */}
      {phase === 'onboarding' && !typing && currentQ && (
        <OnboardingInput
          question={currentQ}
          inputValue={inputValue}
          multiSel={multiSel}
          onInputChange={setInputValue}
          onMultiToggle={v => setMultiSel(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
          onChipClick={handleChipClick}
          onMultiConfirm={handleMultiConfirm}
          onTextSubmit={handleTextSubmit}
          onSkip={handleSkip}
        />
      )}
    </div>
  )
}
