'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowUp, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ConversationList } from '@/components/board/ConversationList'
import { CuriaChambra } from '@/components/board/chamber/CuriaChambra'
import { getInitialDeliberationState } from '@/lib/deliberation/store'
import type { ChambraState } from '@/components/board/chamber/chambraStates'
import type { Conversation } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Bloco 1 — abertura
  company_name: string
  industry: string
  business_type: string
  product_description: string
  // Bloco 2 — narrativa
  ideal_customer_story: string
  why_they_paid: string
  current_moment: string
  // Bloco 3 — números (condicional)
  average_ticket: string
  mrr: string
  churn_rate: string
  cac: string
  ltv: string
  monthly_revenue: string
  gross_margin: string
  max_capacity: string
  gmv: string
  take_rate: string
  marketplace_weak_side: string
  active_customers: string
  // Bloco 4 — tensão
  keeping_up_at_night: string
  current_hypothesis: string
  what_tried: string
  pending_decision: string
}

type QType = 'text' | 'textarea' | 'number' | 'chips' | 'chips-descriptive'

interface Question {
  id: string
  key: keyof FormData
  block: 1 | 2 | 3 | 4
  message: string
  subtext?: string
  type: QType
  chips?: { label: string; value: string; description?: string }[]
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INIT: FormData = {
  company_name: '', industry: '', business_type: '', product_description: '',
  ideal_customer_story: '', why_they_paid: '', current_moment: '',
  average_ticket: '', mrr: '', churn_rate: '', cac: '', ltv: '',
  monthly_revenue: '', gross_margin: '', max_capacity: '',
  gmv: '', take_rate: '', marketplace_weak_side: '', active_customers: '',
  keeping_up_at_night: '', current_hypothesis: '', what_tried: '', pending_decision: '',
}

const INDUSTRY_OPTIONS = [
  { label: 'Tech / SaaS', value: 'tech' },
  { label: 'Varejo', value: 'varejo' },
  { label: 'Serviços', value: 'servicos' },
  { label: 'Saúde', value: 'saude' },
  { label: 'Educação', value: 'educacao' },
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Agro', value: 'agro' },
  { label: 'Indústria', value: 'industria' },
  { label: 'Outro', value: 'outro' },
] as const

const CURRENT_MOMENT_OPTIONS = [
  {
    value: 'searching_pmf',
    label: 'Buscando PMF',
    description: 'Ainda buscando PMF — ainda não tá claro quem é o cliente ideal nem por que pagam',
  },
  {
    value: 'signs_of_pmf',
    label: 'Sinais de PMF',
    description: 'Tenho sinais de PMF, mas o crescimento ainda é manual e irregular',
  },
  {
    value: 'have_pmf_scaling',
    label: 'Com PMF, querendo acelerar',
    description: 'Tenho PMF, quero acelerar e escalar aquisição',
  },
  {
    value: 'scaling_breaking',
    label: 'Escalando e quebrando coisas',
    description: 'Escalando rápido e quebrando coisas — operação travando o crescimento',
  },
  {
    value: 'stable_next_scurve',
    label: 'Estável, buscando próximo S-curve',
    description: 'Estável e lucrativo, buscando o próximo S-curve',
  },
  {
    value: 'restructuring',
    label: 'Reestruturação / pivot',
    description: 'Em reestruturação ou pivot',
  },
]

const BLOCK_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: 'Abertura',
  2: 'Narrativa',
  3: 'Números',
  4: 'O que tá pegando',
}

const QUESTIONS: Question[] = [
  // ── Bloco 1 — Abertura ───────────────────────────────────────────────────────
  {
    id: 'business_type', key: 'business_type', block: 1,
    message: 'Qual é o tipo de produto ou serviço?',
    type: 'chips',
    chips: [
      { label: 'SaaS', value: 'saas' },
      { label: 'App', value: 'app' },
      { label: 'Marketplace', value: 'marketplace' },
      { label: 'Serviço', value: 'service' },
      { label: 'Produto físico', value: 'physical_product' },
      { label: 'Outro', value: 'other' },
    ],
  },
  {
    id: 'product_description', key: 'product_description', block: 1,
    message: 'Em uma frase, o que sua empresa faz?',
    subtext: 'Escreve como você explicaria pra sua avó — sem jargão.',
    type: 'textarea',
    placeholder: 'Ex: a gente ajuda dentistas de bairro a lotar a agenda…',
  },

  // ── Bloco 2 — Narrativa ──────────────────────────────────────────────────────
  {
    id: 'ideal_customer_story', key: 'ideal_customer_story', block: 2,
    message: 'Descreve um cliente real que entrou recentemente.',
    subtext: 'Quem é essa pessoa, como ela chegou em vocês, e o que estava acontecendo na vida dela pra procurar uma solução?',
    type: 'textarea',
    placeholder: 'Ex: a Mariana é dentista em Santos, herdou a clínica do pai…',
  },
  {
    id: 'why_they_paid', key: 'why_they_paid', block: 2,
    message: 'Por que essa pessoa te pagou, em vez de continuar do jeito que estava ou ir pro concorrente?',
    type: 'textarea',
    placeholder: 'Ex: ela já tinha tentado duas agências antes e nada funcionou porque…',
  },
  {
    id: 'current_moment', key: 'current_moment', block: 2,
    message: 'Qual é o momento da empresa hoje?',
    type: 'chips-descriptive',
    chips: CURRENT_MOMENT_OPTIONS,
  },

  // ── Bloco 3 — Números (condicional, todos opcionais) ─────────────────────────
  // SaaS / App
  { id: 'mrr', key: 'mrr', block: 3, message: 'Qual é o MRR atual?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  { id: 'churn_rate', key: 'churn_rate', block: 3, message: 'Churn mensal?', type: 'number', suffix: '%', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  { id: 'cac', key: 'cac', block: 3, message: 'CAC?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  { id: 'ltv', key: 'ltv', block: 3, message: 'LTV?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  { id: 'active_customers_saas', key: 'active_customers', block: 3, message: 'Quantos clientes ativos hoje?', type: 'number', optional: true, skipIf: f => !['saas', 'app'].includes(f.business_type) },
  // Marketplace
  { id: 'gmv', key: 'gmv', block: 3, message: 'GMV mensal?', type: 'number', prefix: 'R$', optional: true, skipIf: f => f.business_type !== 'marketplace' },
  { id: 'take_rate', key: 'take_rate', block: 3, message: 'Take rate?', type: 'number', suffix: '%', optional: true, skipIf: f => f.business_type !== 'marketplace' },
  {
    id: 'marketplace_weak_side', key: 'marketplace_weak_side', block: 3,
    message: 'Qual é o lado mais fraco do marketplace?',
    type: 'chips', optional: true, skipIf: f => f.business_type !== 'marketplace',
    chips: [
      { label: 'Oferta', value: 'supply' },
      { label: 'Demanda', value: 'demand' },
      { label: 'Ambos equilibrados', value: 'balanced' },
    ],
  },
  // Serviço
  { id: 'monthly_revenue_s', key: 'monthly_revenue', block: 3, message: 'Faturamento mensal?', type: 'number', prefix: 'R$', optional: true, skipIf: f => f.business_type !== 'service' },
  { id: 'gross_margin_s', key: 'gross_margin', block: 3, message: 'Margem bruta?', type: 'number', suffix: '%', optional: true, skipIf: f => f.business_type !== 'service' },
  { id: 'max_capacity', key: 'max_capacity', block: 3, message: 'Capacidade máxima por mês (clientes ou projetos)?', type: 'number', optional: true, skipIf: f => f.business_type !== 'service' },
  { id: 'active_customers_service', key: 'active_customers', block: 3, message: 'Quantos clientes ativos hoje?', type: 'number', optional: true, skipIf: f => f.business_type !== 'service' },
  // Produto físico / Outro
  { id: 'monthly_revenue_p', key: 'monthly_revenue', block: 3, message: 'Faturamento mensal?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['physical_product', 'other'].includes(f.business_type) },
  { id: 'gross_margin_p', key: 'gross_margin', block: 3, message: 'Margem bruta?', type: 'number', suffix: '%', optional: true, skipIf: f => !['physical_product', 'other'].includes(f.business_type) },
  { id: 'average_ticket', key: 'average_ticket', block: 3, message: 'Ticket médio?', type: 'number', prefix: 'R$', optional: true, skipIf: f => !['physical_product', 'other'].includes(f.business_type) },

  // ── Bloco 4 — O que tá pegando ───────────────────────────────────────────────
  {
    id: 'keeping_up_at_night', key: 'keeping_up_at_night', block: 4,
    message: 'O que está te tirando o sono hoje?',
    subtext: 'Pode ser uma coisa concreta (um número que não anda) ou uma sensação (algo tá errado e eu não sei o quê). Escreve como se tivesse desabafando com um amigo mais velho.',
    type: 'textarea',
    placeholder: 'Ex: o MRR tá andando mas as demos estão caindo há 3 semanas…',
  },
  {
    id: 'current_hypothesis', key: 'current_hypothesis', block: 4,
    message: 'Qual é sua hipótese atual pro que tá causando isso?',
    subtext: 'Mesmo sem certeza. Qual é seu palpite?',
    type: 'textarea',
    placeholder: 'Ex: acho que a gente tá atraindo a lead errada pelo anúncio novo…',
  },
  {
    id: 'what_tried', key: 'what_tried', block: 4,
    message: 'O que você já tentou pra resolver isso, e por que não funcionou (ou não funcionou o suficiente)?',
    type: 'textarea',
    placeholder: 'Ex: troquei o copy duas vezes, rodei três criativos novos, e…',
  },
  {
    id: 'pending_decision', key: 'pending_decision', block: 4,
    message: 'Qual decisão você precisa tomar nas próximas 2 semanas?',
    subtext: 'Pode ser uma contratação, um corte, um pivot, um investimento, uma conversa difícil. O que tá parado esperando uma decisão sua?',
    type: 'textarea',
    placeholder: 'Ex: se contrato um head de growth agora ou seguro mais 2 meses e faço eu…',
  },
]

const LOADING_MSGS = [
  'Guardando tudo que você contou…',
  'Montando o briefing do seu board…',
  'Preparando a primeira leitura do seu conselho…',
  'Conectando o contexto aos agentes…',
  'Abrindo a sala…',
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
  if (q.type === 'chips' || q.type === 'chips-descriptive') return getChipLabel(q, value)
  return value
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMsg }) {
  if (msg.from === 'curia') {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B0B0F]">
          <span className="font-curia-rounded text-xs text-white">C</span>
        </div>
        <div className="flex-1 max-w-[85%]">
          <div className="rounded-2xl rounded-tl-sm bg-white border border-[#0B0B0F]/10 px-4 py-3 shadow-sm">
            <p className="council-textarea text-sm leading-relaxed text-[#0B0B0F]" style={{ minHeight: 'auto', maxHeight: 'none', overflow: 'visible' }}>
              {msg.text}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#0B0B0F] px-4 py-3 shadow-sm">
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
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B0B0F]">
        <span className="font-curia-rounded text-xs text-white">C</span>
      </div>
      <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-white border border-[#0B0B0F]/10 px-4 py-3.5 shadow-sm">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0B0B0F]/35 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

interface InputAreaProps {
  question: Question
  inputValue: string
  onInputChange: (v: string) => void
  onChipClick: (value: string, label: string) => void
  onTextSubmit: () => void
  onSkip: () => void
}

function OnboardingInput({
  question, inputValue,
  onInputChange, onChipClick, onTextSubmit, onSkip,
}: InputAreaProps) {
  const isChipType = question.type === 'chips' || question.type === 'chips-descriptive'
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

        {/* Chips simples */}
        {question.type === 'chips' && (
          <div className="mb-3 flex flex-wrap gap-2">
            {question.chips?.map(chip => (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChipClick(chip.value, chip.label)}
                className="rounded-full border px-4 py-1.5 text-sm font-medium transition-all bg-white border-[#0B0B0F]/20 text-[#0B0B0F] hover:border-[#0B0B0F]/50"
              >
                {chip.label}
              </button>
            ))}
            {question.optional && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border border-[#0B0B0F]/10 px-4 py-1.5 text-sm text-[#0B0B0F]/40 transition-all hover:border-[#0B0B0F]/25 hover:text-[#0B0B0F]/60"
              >
                Pular →
              </button>
            )}
          </div>
        )}

        {/* Chips descritivos (current_moment) — empilhados */}
        {question.type === 'chips-descriptive' && (
          <div className="mb-3 flex flex-col gap-2">
            {question.chips?.map(chip => (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChipClick(chip.value, chip.label)}
                className="rounded-2xl border border-[#0B0B0F]/15 bg-white px-4 py-3 text-left text-sm text-[#0B0B0F] transition-all hover:border-[#0B0B0F]/40 hover:bg-white/80"
              >
                <span className="block font-semibold">{chip.label}</span>
                {chip.description && (
                  <span className="mt-0.5 block text-[13px] text-[#0B0B0F]/60">{chip.description}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="council-input-box">
          {isChipType ? (
            <span className="council-textarea select-none text-sm" style={{ minHeight: 'auto', maxHeight: 'none', overflow: 'visible', fontStyle: 'italic', opacity: 0.3 }}>
              Selecione uma opção acima…
            </span>
          ) : question.type === 'textarea' ? (
            <textarea
              autoFocus
              rows={2}
              value={inputValue}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label={question.message}
              placeholder={question.placeholder ?? ''}
              className="council-textarea council-textarea-home"
              style={{ minHeight: '64px' }}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              {question.prefix && (
                <span className="shrink-0 text-sm text-[#0B0B0F]/50">{question.prefix}</span>
              )}
              <input
                autoFocus
                type={question.type === 'number' ? 'number' : 'text'}
                value={inputValue}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label={question.message}
                placeholder={question.placeholder ?? '0'}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-[#0B0B0F] placeholder:text-[#0B0B0F]/35"
                style={{ minHeight: '24px' }}
              />
              {question.suffix && (
                <span className="shrink-0 text-sm text-[#0B0B0F]/50">{question.suffix}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="council-input-footer">
            <div className="council-input-tools">
              <span className="council-model-badge">
                {BLOCK_LABEL[question.block]}
              </span>
            </div>

            {isTextType && (
              <button
                type="button"
                onClick={onTextSubmit}
                disabled={!inputValue.trim()}
                className="council-send-round"
                aria-label="Enviar"
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Skip link para text/number opcionais */}
        {isTextType && question.optional && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-[#0B0B0F]/35 transition-colors hover:text-[#0B0B0F]/55"
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
  const { signOut } = useClerk()
  const [form, setForm] = useState<FormData>(INIT)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [qIdx, setQIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'init' | 'terms' | 'onboarding' | 'submitting' | 'error'>('init')
  const [typing, setTyping] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [submitForm, setSubmitForm] = useState<FormData | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [bootForm, setBootForm] = useState<FormData | null>(null)
  const [profileName, setProfileName] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const [termsLoading, setTermsLoading] = useState(false)
  const [termsError, setTermsError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentQ = qIdx !== null ? QUESTIONS[qIdx] : null

  const chambraState: ChambraState =
    phase === 'submitting'                          ? 'deliberating'
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

  const startOnboardingFlow = useCallback((prefilled: FormData) => {
    setTermsError(null)
    setPhase('onboarding')
    setMsgs([{
      id: crypto.randomUUID(),
      from: 'curia',
      text: 'Antes da gente abrir o board, quero te conhecer. Algumas perguntas rápidas e algumas que pedem um pouco de respiro — responde no tempo que precisar.',
    }])
    setQIdx(null)
    setInputValue('')

    setTimeout(() => {
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), from: 'curia', text: QUESTIONS[0].message }])
      setQIdx(0)
      if (prefilled.business_type) setInputValue('')
    }, 700)
  }, [])

  useEffect(() => {
    async function bootstrap() {
      const [sessionRes, onboardingRes, termsRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/onboarding'),
        fetch('/api/terms/accept'),
      ])

      const sessionData = sessionRes.ok
        ? await sessionRes.json() as { user?: { firstName?: string | null; fullName?: string | null } | null }
        : { user: null }

      if (sessionData.user) {
        setFirstName(sessionData.user.firstName ?? null)
        setProfileName(sessionData.user.fullName ?? sessionData.user.firstName ?? '')
      }

      const onboardingData = onboardingRes.ok
        ? await onboardingRes.json() as { company?: Record<string, unknown> | null }
        : { company: null }
      const termsData = termsRes.ok
        ? await termsRes.json() as { accepted?: boolean }
        : { accepted: false }

      const company = onboardingData.company as {
        companyName?: string | null
        industry?: string | null
        businessType?: string | null
        productDescription?: string | null
        idealCustomerStory?: string | null
        whyTheyPaid?: string | null
        currentMoment?: string | null
        averageTicket?: string | null
        mrr?: string | null
        churnRate?: string | null
        cac?: string | null
        ltv?: string | null
        monthlyRevenue?: string | null
        grossMargin?: string | null
        maxCapacity?: number | null
        gmv?: string | null
        takeRate?: string | null
        marketplaceWeakSide?: string | null
        activeCustomers?: number | null
        keepingUpAtNight?: string | null
        currentHypothesis?: string | null
        whatTried?: string | null
        pendingDecision?: string | null
      } | null

      const prefilled: FormData = company ? {
        company_name: company.companyName ?? '',
        industry: company.industry ?? '',
        business_type: company.businessType ?? '',
        product_description: company.productDescription ?? '',
        ideal_customer_story: company.idealCustomerStory ?? '',
        why_they_paid: company.whyTheyPaid ?? '',
        current_moment: company.currentMoment ?? '',
        average_ticket: company.averageTicket != null ? String(company.averageTicket) : '',
        mrr: company.mrr != null ? String(company.mrr) : '',
        churn_rate: company.churnRate != null ? String(company.churnRate) : '',
        cac: company.cac != null ? String(company.cac) : '',
        ltv: company.ltv != null ? String(company.ltv) : '',
        monthly_revenue: company.monthlyRevenue != null ? String(company.monthlyRevenue) : '',
        gross_margin: company.grossMargin != null ? String(company.grossMargin) : '',
        max_capacity: company.maxCapacity != null ? String(company.maxCapacity) : '',
        gmv: company.gmv != null ? String(company.gmv) : '',
        take_rate: company.takeRate != null ? String(company.takeRate) : '',
        marketplace_weak_side: company.marketplaceWeakSide ?? '',
        active_customers: company.activeCustomers != null ? String(company.activeCustomers) : '',
        keeping_up_at_night: company.keepingUpAtNight ?? '',
        current_hypothesis: company.currentHypothesis ?? '',
        what_tried: company.whatTried ?? '',
        pending_decision: company.pendingDecision ?? '',
      } : { ...INIT }

      setForm(prefilled)
      setBootForm(prefilled)

      if (!termsData.accepted) {
        setPhase('terms')
        return
      }

      startOnboardingFlow(prefilled)
    }

    void bootstrap()
  }, [startOnboardingFlow])

  useEffect(() => {
    if (!submitForm) return
    runSubmit(submitForm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitForm])

  function addMsg(from: ChatMsg['from'], text: string) {
    setMsgs(prev => [...prev, { id: crypto.randomUUID(), from, text }])
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
      const prefix = nextQ.subtext ? `${nextQ.message}\n\n${nextQ.subtext}` : nextQ.message
      addMsg('curia', prefix)
      setQIdx(nextIdx)
      setInputValue('')
      const existing = updatedForm[nextQ.key]
      if (existing && nextQ.type !== 'chips' && nextQ.type !== 'chips-descriptive') {
        setInputValue(existing)
      }
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
    setSubmitError(null)
    try {
      const payload = {
        company_name: finalForm.company_name,
        industry: finalForm.industry,
        business_type: finalForm.business_type,
        product_description: finalForm.product_description,
        ideal_customer_story: finalForm.ideal_customer_story,
        why_they_paid: finalForm.why_they_paid,
        current_moment: finalForm.current_moment,
        keeping_up_at_night: finalForm.keeping_up_at_night,
        current_hypothesis: finalForm.current_hypothesis,
        what_tried: finalForm.what_tried,
        pending_decision: finalForm.pending_decision,
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
        marketplace_weak_side: finalForm.marketplace_weak_side || undefined,
        active_customers: finalForm.active_customers  ? Number(finalForm.active_customers)  : undefined,
      }
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(errorPayload?.error || 'Erro ao preparar seu board')
      }
      const data = await res.json() as { conversation_id?: string }

      if (!data.conversation_id) throw new Error('Resposta sem conversation_id')

      // Handoff contínuo — aterrissa direto na conversa já com a primeira fala do board
      router.replace(`/board?conversation=${data.conversation_id}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erro desconhecido ao preparar seu board.')
      setPhase('error')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (phase === 'init') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#FDFBF9' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0B0F]">
          <span className="font-curia-rounded text-lg text-white">C</span>
        </div>
      </div>
    )
  }

  async function handleAcceptTerms() {
    const normalizedName = profileName.trim()
    const normalizedCompany = form.company_name.trim()
    const normalizedIndustry = form.industry.trim()

    if (!normalizedName || !normalizedCompany || !normalizedIndustry) {
      setTermsError('Preencha seu nome, nome da empresa e setor antes de continuar.')
      return
    }

    if (!termsChecked) {
      setTermsError('Confirme o aceite para continuar.')
      return
    }

    setTermsError(null)
    setTermsLoading(true)

    try {
      const bootstrapRes = await fetch('/api/onboarding/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: normalizedName,
          company_name: normalizedCompany,
          industry: normalizedIndustry,
        }),
      })
      if (!bootstrapRes.ok) {
        throw new Error('Não foi possível registrar os dados iniciais do onboarding.')
      }

      const bootstrapData = await bootstrapRes.json() as { firstName?: string | null }
      setFirstName(bootstrapData.firstName ?? normalizedName.split(/\s+/)[0] ?? null)

      const nextForm = {
        ...(bootForm ?? form),
        company_name: normalizedCompany,
        industry: normalizedIndustry,
      }
      setForm(nextForm)
      setBootForm(nextForm)

      const res = await fetch('/api/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms_version: process.env.NEXT_PUBLIC_TERMS_VERSION || '1.0' }),
      })
      if (!res.ok) {
        throw new Error('Não foi possível registrar o aceite dos termos.')
      }

      startOnboardingFlow(nextForm)
    } catch {
      setTermsError('Não foi possível registrar o aceite agora. Tente novamente.')
    } finally {
      setTermsLoading(false)
    }
  }

  const showChamber =
    phase === 'submitting' ||
    (phase === 'onboarding' && (typing || qIdx === null))

  const chamberHeight = qIdx === null ? '38vh' : '28vh'

  return (
    <div className="flex h-screen" style={{ background: '#FDFBF9' }}>
      <aside
        className="shrink-0 overflow-hidden transition-all duration-200"
        style={{ width: sidebarOpen ? '15rem' : '0', background: '#F5F0EC' }}
      >
        <div className="h-full w-60">
          <ConversationList
            conversations={[] as Conversation[]}
            activeId={undefined}
            onSelect={() => {}}
            onNew={() => {}}
            newConversationDisabled
            newConversationDisabledReason="Finalize o onboarding para abrir o board"
            loading={false}
            plans={[]}
            strategies={[]}
            userName={firstName ?? undefined}
            onToggleSidebar={() => setSidebarOpen(o => !o)}
            sidebarOpen={sidebarOpen}
            onLogout={async () => {
              await signOut({ redirectUrl: '/' })
            }}
          />
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden" style={{ background: '#FDFBF9' }}>
        {!sidebarOpen && (
          <div className="flex items-center px-3 py-1.5" style={{ minHeight: '40px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#0B0B0F]/40 transition-colors hover:bg-[#0B0B0F]/[0.06] hover:text-[#0B0B0F]/70"
              title="Abrir sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}

        {showChamber && (
          <div className="relative w-full shrink-0" style={{ height: chamberHeight }}>
            {firstName && phase === 'onboarding' ? (
              <div className="pointer-events-none absolute left-1/2 z-10 -top-2 -translate-x-1/2 md:-top-3">
                <span className="italic text-2xl leading-none text-[#C9A84C] md:text-4xl">
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

        <div className="flex-1 overflow-y-auto">
          {phase === 'terms' ? (
            <div className="mx-auto flex h-full w-full max-w-4xl items-center justify-center px-4 py-8">
              <div className="w-full max-w-xl rounded-3xl border border-[#0B0B0F]/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(11,11,15,0.08)]">
                <div className="text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B0B0F]/40">
                    Antes de começar
                  </p>
                  <h1 className="mt-2 font-curia-rounded text-2xl text-[#0B0B0F]">Aceite os termos para abrir seu Board</h1>
                  <p className="mt-3 text-sm leading-relaxed text-[#0B0B0F]/65">
                    Sua autenticação já foi concluída. Falta só registrar o aceite dos{' '}
                    <a href="/terms" target="_blank" className="text-[#4A6FA5] hover:underline">Termos de Uso</a> e da{' '}
                    <a href="/privacy" target="_blank" className="text-[#4A6FA5] hover:underline">Política de Privacidade</a>.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="onboarding-profile-name" className="mb-1.5 block text-sm font-medium text-[#0B0B0F]">
                      Seu nome
                    </label>
                    <input
                      id="onboarding-profile-name"
                      type="text"
                      value={profileName}
                      onChange={(e) => {
                        setProfileName(e.target.value)
                        setTermsError(null)
                      }}
                      placeholder="Ex: Felipe"
                      className="flex h-11 w-full rounded-xl border border-[#0B0B0F]/15 bg-white px-4 text-sm text-[#0B0B0F] shadow-sm outline-none transition-all placeholder:text-[#0B0B0F]/35 focus-visible:border-[#C9A84C]/60 focus-visible:ring-2 focus-visible:ring-[#C9A84C]/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="onboarding-company-name" className="mb-1.5 block text-sm font-medium text-[#0B0B0F]">
                      Nome da empresa
                    </label>
                    <input
                      id="onboarding-company-name"
                      type="text"
                      value={form.company_name}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, company_name: e.target.value }))
                        setBootForm((prev) => ({ ...(prev ?? INIT), company_name: e.target.value, industry: prev?.industry ?? form.industry }))
                        setTermsError(null)
                      }}
                      placeholder="Ex: Curia, Nubank, Stone…"
                      className="flex h-11 w-full rounded-xl border border-[#0B0B0F]/15 bg-white px-4 text-sm text-[#0B0B0F] shadow-sm outline-none transition-all placeholder:text-[#0B0B0F]/35 focus-visible:border-[#C9A84C]/60 focus-visible:ring-2 focus-visible:ring-[#C9A84C]/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0B0B0F]">Setor que atua</label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, industry: option.value }))
                            setBootForm((prev) => ({ ...(prev ?? INIT), company_name: prev?.company_name ?? form.company_name, industry: option.value }))
                            setTermsError(null)
                          }}
                          className={cn(
                            'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                            form.industry === option.value
                              ? 'border-[#0B0B0F] bg-[#0B0B0F] text-white'
                              : 'border-[#0B0B0F]/20 bg-white text-[#0B0B0F] hover:border-[#0B0B0F]/50',
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#0B0B0F]/10 bg-[#FDFBF9] p-4">
                  <input
                    type="checkbox"
                    checked={termsChecked}
                    onChange={(e) => {
                      setTermsChecked(e.target.checked)
                      setTermsError(null)
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#0B0B0F]/20 accent-[#0B0B0F]"
                  />
                  <span className="text-sm leading-relaxed text-[#0B0B0F]/70">
                    Li e concordo com os termos e políticas da Curia.
                  </span>
                </label>

                {termsError && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{termsError}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleAcceptTerms()}
                  disabled={termsLoading}
                  className={cn(
                    'mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3',
                    'bg-[#0B0B0F] text-sm font-semibold text-[#FDFBF9]',
                    'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  {termsLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B0B0F]/30 border-t-[#0B0B0F]" />
                  ) : (
                    <>
                      <span>Aceitar e continuar</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : phase === 'submitting' ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-[#4A9B6F] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-[#0B0B0F]/60 transition-all duration-500">
                {LOADING_MSGS[loadingMsgIdx]}
              </p>
            </div>
          ) : phase === 'error' ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-sm text-[#0B0B0F]/60">
                Algo deu errado ao preparar o seu board.
              </p>
              {submitError ? (
                <p className="max-w-xl text-xs text-[#0B0B0F]/45">
                  {submitError}
                </p>
              ) : null}
              <button
                onClick={() => submitForm && runSubmit(submitForm)}
                className="rounded-xl border border-[#0B0B0F]/15 bg-white px-5 py-2.5 text-sm text-[#0B0B0F] shadow-sm transition-all hover:border-[#0B0B0F]/35 hover:bg-white/90"
              >
                Tentar de novo
              </button>
            </div>
          ) : (
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-4">
                  {msgs.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  {typing && <TypingDots />}
                  <div ref={bottomRef} />
                </div>
              </div>

              {currentQ && (
                <OnboardingInput
                  question={currentQ}
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  onChipClick={handleChipClick}
                  onTextSubmit={handleTextSubmit}
                  onSkip={handleSkip}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}