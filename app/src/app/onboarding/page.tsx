'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

const INITIAL: FormData = {
  company_name: '', industry: '', team_size: '', founded_period: '', capital_stage: '',
  business_type: '', business_model: '', monetization: '', product_description: '', average_ticket: '',
  mrr: '', churn_rate: '', cac: '', ltv: '',
  monthly_revenue: '', gross_margin: '', max_capacity: '',
  gmv: '', take_rate: '', marketplace_weak_side: '',
  active_customers: '', icp_defined: '', icp_description: '',
  acquisition_channel: '', main_bottleneck: '', main_bottleneck_detail: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function canProceed(step: number, form: FormData): boolean {
  if (step === 1) return !!form.company_name && !!form.industry && !!form.team_size
  if (step === 2) return !!form.business_type && !!form.product_description
  if (step === 3) return true
  if (step === 4) return !!form.acquisition_channel && !!form.icp_defined
  if (step === 5) return !!form.main_bottleneck
  return true
}

// ─── Shared style tokens (espelha AuthForm.tsx) ───────────────────────────────

const inputCls =
  'flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4 ' +
  'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35 ' +
  'shadow-sm transition-all focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50 focus-visible:border-[#FF6F1E]/60'

const labelCls = 'mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]'

const optionBase =
  'rounded-xl border px-3 py-2.5 font-curia-serif text-sm font-medium text-left transition-all shadow-sm'
const optionOff = 'bg-white border-[#2B1A07]/15 text-[#2B1A07]/80 hover:border-[#2B1A07]/40'
const optionOn  = 'bg-[#2B1A07] text-white border-[#2B1A07]'

// ─── UI Primitives ────────────────────────────────────────────────────────────

function OptionGrid({
  options, value, onChange, cols = 2,
}: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value === value ? '' : opt.value)}
          className={`${optionBase} ${value === opt.value ? optionOn : optionOff}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function NumField({
  label, value, onChange, prefix, suffix, placeholder = '0',
}: { label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; placeholder?: string }) {
  return (
    <div>
      <label className={labelCls}>
        {label} <span className="text-[#2B1A07]/40 font-normal">— opcional</span>
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-curia-serif text-sm text-[#2B1A07]/50">{prefix}</span>}
        <input
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${inputCls} ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-curia-serif text-sm text-[#2B1A07]/50">{suffix}</span>}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className={labelCls}>{children}</label>
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Nome da empresa *</Label>
        <input
          type="text"
          placeholder="Ex: Curia, Nubank, Stone..."
          value={form.company_name}
          onChange={e => update('company_name', e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <Label>Setor / Indústria *</Label>
        <OptionGrid
          cols={3}
          value={form.industry}
          onChange={v => update('industry', v)}
          options={[
            { label: 'Tech / SaaS', value: 'tech' },
            { label: 'Varejo', value: 'varejo' },
            { label: 'Serviços', value: 'servicos' },
            { label: 'Saúde', value: 'saude' },
            { label: 'Educação', value: 'educacao' },
            { label: 'Financeiro', value: 'financeiro' },
            { label: 'Agro', value: 'agro' },
            { label: 'Indústria', value: 'industria' },
            { label: 'Outro', value: 'outro' },
          ]}
        />
      </div>
      <div>
        <Label>Tamanho do time *</Label>
        <OptionGrid
          cols={4}
          value={form.team_size}
          onChange={v => update('team_size', v)}
          options={[
            { label: 'Só eu', value: 'solo' },
            { label: '2–10', value: '2-10' },
            { label: '11–50', value: '11-50' },
            { label: '50+', value: '50+' },
          ]}
        />
      </div>
      <div>
        <Label>Quando foi fundada</Label>
        <OptionGrid
          cols={4}
          value={form.founded_period}
          onChange={v => update('founded_period', v)}
          options={[
            { label: '2024–2025', value: '2024-2025' },
            { label: '2022–2023', value: '2022-2023' },
            { label: '2018–2021', value: '2018-2021' },
            { label: 'Antes de 2018', value: 'pre-2018' },
          ]}
        />
      </div>
    </div>
  )
}

function Step2({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Tipo de produto *</Label>
        <OptionGrid
          cols={3}
          value={form.business_type}
          onChange={v => update('business_type', v)}
          options={[
            { label: 'SaaS', value: 'saas' },
            { label: 'Produto físico', value: 'physical_product' },
            { label: 'Serviço', value: 'service' },
            { label: 'Marketplace', value: 'marketplace' },
            { label: 'App', value: 'app' },
            { label: 'Outro', value: 'other' },
          ]}
        />
      </div>
      <div>
        <Label>Venda o seu produto para nós *</Label>
        <p className="mb-2 font-curia-serif text-xs text-[#2B1A07]/50">
          Fale como se estivesse convencendo um cliente em 30 segundos — o que é, para quem, por que pagam e o que te diferencia.
        </p>
        <textarea
          rows={4}
          placeholder="Ex: A Curia é um board consultivo de IA para founders. Por R$99/mês você tem 6 conselheiros especializados que analisam seu negócio, questionam suas premissas e te ajudam a tomar decisões melhores. Diferente de consultores tradicionais, está disponível 24h e custa 100x menos."
          value={form.product_description}
          onChange={e => update('product_description', e.target.value)}
          className={`${inputCls} h-auto py-3 resize-none`}
        />
      </div>
      <div>
        <NumField
          label="Ticket médio"
          prefix="R$"
          value={form.average_ticket}
          onChange={v => update('average_ticket', v)}
          placeholder="Ex: 299"
        />
        <p className="mt-1.5 font-curia-serif text-xs text-[#2B1A07]/40">
          Se não souber agora, tudo bem — te ajudamos a calcular depois.
        </p>
      </div>
    </div>
  )
}

function Step3Subscription({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <NumField label="MRR" prefix="R$" value={form.mrr} onChange={v => update('mrr', v)} />
      <NumField label="Churn mensal" suffix="%" value={form.churn_rate} onChange={v => update('churn_rate', v)} />
      <NumField label="CAC" prefix="R$" value={form.cac} onChange={v => update('cac', v)} />
      <NumField label="LTV" prefix="R$" value={form.ltv} onChange={v => update('ltv', v)} />
    </div>
  )
}

function Step3Transactional({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <NumField label="Faturamento mensal" prefix="R$" value={form.monthly_revenue} onChange={v => update('monthly_revenue', v)} />
      <NumField label="Margem bruta" suffix="%" value={form.gross_margin} onChange={v => update('gross_margin', v)} />
    </div>
  )
}

function Step3Service({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <NumField label="Faturamento mensal" prefix="R$" value={form.monthly_revenue} onChange={v => update('monthly_revenue', v)} />
      <NumField label="Ticket médio" prefix="R$" value={form.average_ticket} onChange={v => update('average_ticket', v)} />
      <div className="col-span-2">
        <NumField label="Capacidade máxima por mês" placeholder="Nº de clientes ou projetos" value={form.max_capacity} onChange={v => update('max_capacity', v)} />
      </div>
    </div>
  )
}

function Step3Marketplace({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <NumField label="GMV mensal" prefix="R$" value={form.gmv} onChange={v => update('gmv', v)} />
        <NumField label="Take rate" suffix="%" value={form.take_rate} onChange={v => update('take_rate', v)} />
      </div>
      <div>
        <Label>Lado mais fraco do marketplace</Label>
        <OptionGrid
          cols={2}
          value={form.marketplace_weak_side}
          onChange={v => update('marketplace_weak_side', v)}
          options={[
            { label: 'Supply (oferta)', value: 'supply' },
            { label: 'Demand (demanda)', value: 'demand' },
          ]}
        />
      </div>
    </div>
  )
}

function Step3({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  const type = form.business_type
  const isSubscription = type === 'saas' || type === 'app' || form.monetization === 'subscription'
  const isMarketplace = type === 'marketplace'
  const isService = type === 'service'

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#2B1A07]/50 mb-4">Todos os campos são opcionais — preencha o que souber agora.</p>
      {isMarketplace ? (
        <Step3Marketplace form={form} update={update} />
      ) : isService ? (
        <Step3Service form={form} update={update} />
      ) : isSubscription ? (
        <Step3Subscription form={form} update={update} />
      ) : (
        <Step3Transactional form={form} update={update} />
      )}
    </div>
  )
}

function Step4({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <NumField
        label="Clientes / usuários ativos"
        placeholder="Ex: 45"
        value={form.active_customers}
        onChange={v => update('active_customers', v)}
      />
      <div>
        <Label>Você tem ICP definido? *</Label>
        <OptionGrid
          cols={2}
          value={form.icp_defined}
          onChange={v => update('icp_defined', v)}
          options={[
            { label: 'Sim, tenho claro', value: 'yes' },
            { label: 'Ainda não', value: 'no' },
          ]}
        />
      </div>
      {form.icp_defined === 'yes' && (
        <div>
          <Label>Descreva seu ICP</Label>
          <textarea
            rows={2}
            placeholder="Ex: Founders de SaaS B2B com 5–50 clientes, faturando entre R$20k e R$100k MRR..."
            value={form.icp_description}
            onChange={e => update('icp_description', e.target.value)}
            className={`${inputCls} h-auto py-3 resize-none`}
          />
        </div>
      )}
      <div>
        <Label>Principal canal de aquisição *</Label>
        <OptionGrid
          cols={2}
          value={form.acquisition_channel}
          onChange={v => update('acquisition_channel', v)}
          options={[
            { label: 'Orgânico / SEO', value: 'organic' },
            { label: 'Anúncios pagos', value: 'paid_ads' },
            { label: 'Indicação / WOM', value: 'referral' },
            { label: 'Outbound / Vendas', value: 'outbound' },
            { label: 'Parcerias', value: 'partnerships' },
            { label: 'Produto-led (PLG)', value: 'plg' },
          ]}
        />
      </div>
    </div>
  )
}

function Step5({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Qual é o maior gargalo hoje? *</Label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { label: 'Aquisição de clientes',     value: 'acquisition',   desc: 'Difícil trazer novos clientes' },
            { label: 'Retenção / churn',           value: 'retention',     desc: 'Clientes que ficam pouco ou churnam' },
            { label: 'Produto / encontrar PMF',    value: 'product_pmf',   desc: 'Incerteza se o produto resolve a dor certa' },
            { label: 'Capital / runway',           value: 'capital',       desc: 'Pressão financeira ou runway curto' },
            { label: 'Time / operação',            value: 'team_ops',      desc: 'Execução, contratação ou processos' },
            { label: 'Marca / posicionamento',     value: 'brand',         desc: 'Comunicar valor, ser reconhecido' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('main_bottleneck', opt.value === form.main_bottleneck ? '' : opt.value)}
              className={`rounded-xl border px-4 py-3 text-left shadow-sm transition-all ${
                form.main_bottleneck === opt.value
                  ? 'bg-[#2B1A07] text-white border-[#2B1A07]'
                  : 'bg-white border-[#2B1A07]/15 text-[#2B1A07]/80 hover:border-[#2B1A07]/40'
              }`}
            >
              <span className="block font-curia-serif text-sm font-medium">{opt.label}</span>
              <span className={`block font-curia-serif text-xs mt-0.5 ${form.main_bottleneck === opt.value ? 'text-white/70' : 'text-[#2B1A07]/50'}`}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Quer detalhar?</Label>
        <textarea
          rows={2}
          placeholder="Ex: Temos produto bom mas não conseguimos explicar para o cliente certo..."
          value={form.main_bottleneck_detail}
          onChange={e => update('main_bottleneck_detail', e.target.value)}
          className={`${inputCls} h-auto py-3 resize-none`}
        />
      </div>
    </div>
  )
}

function DiagnosisView({ diagnosis, onConfirm }: { diagnosis: Diagnosis; onConfirm: () => void }) {
  const stageCls = STAGE_CLS[diagnosis.stage] ?? 'bg-gray-100 text-gray-700'
  const stageLabel = STAGE_PT[diagnosis.stage] ?? diagnosis.stage

  return (
    <div className="space-y-6">
      {/* Stage */}
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${stageCls}`}>
          {stageLabel}
        </span>
        <p className="mt-2 text-sm text-[#2B1A07]/60 italic">{diagnosis.stage_reason}</p>
      </div>

      {/* Summary */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2B1A07]/50 mb-2">Diagnóstico</p>
        <p className="text-sm leading-relaxed text-[#2B1A07]/80">{diagnosis.diagnostic_summary}</p>
      </div>

      {/* Priority ladder */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2B1A07]/50 mb-3">Escada de Prioridade</p>
        <div className="space-y-3">
          {diagnosis.priority_ladder.map(item => {
            const u = URGENCY[item.urgency] ?? URGENCY.medium
            return (
              <div key={item.rank} className="flex gap-3 rounded-xl border border-[#2B1A07]/10 bg-[#2B1A07]/[0.02] p-4">
                <span className="text-2xl font-curia-rounded text-[#2B1A07]/20 leading-none shrink-0">
                  {String(item.rank).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#2B1A07]">{item.problem}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.cls}`}>
                      {u.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#2B1A07]/60 leading-relaxed">{item.detail}</p>
                  <p className="mt-1.5 text-[10px] font-medium text-[#2B1A07]/40 uppercase tracking-wide">
                    {item.framework}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF6F1E] py-3 text-sm font-semibold text-[#2B1A07] hover:opacity-90 transition-opacity"
      >
        Confirmar e entrar no Board <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'A empresa',       subtitle: 'Vamos conhecer o seu negócio.' },
  { title: 'O negócio',       subtitle: 'Como você opera e monetiza.' },
  { title: 'Métricas',        subtitle: 'Os números que definem onde você está.' },
  { title: 'Tração & ICP',    subtitle: 'Quem compra e como você chega neles.' },
  { title: 'Gargalo atual',   subtitle: 'O maior obstáculo neste momento.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [error, setError] = useState('')
  const [isReturning, setIsReturning] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const createdAt = new Date(user.created_at).getTime()
      if (Date.now() - createdAt > 2 * 60 * 1000) setIsReturning(true)

      // Pré-preencher form com dados existentes do banco
      const { data: company } = await supabase
        .from('companies')
        .select('company_name, industry, team_size, founded_period, capital_stage, business_type, business_model, monetization, product_description, average_ticket, mrr, churn_rate, cac, ltv, monthly_revenue, gross_margin, max_capacity, gmv, take_rate, marketplace_weak_side, active_customers, icp_defined, icp_description, acquisition_channel, main_bottleneck, main_bottleneck_detail')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!company) return

      setForm({
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
      })
    })
  }, [])

  const update = useCallback((k: keyof FormData, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }))
  }, [])

  // Cycle loading messages while waiting for diagnosis
  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1600)
    return () => clearInterval(id)
  }, [loading])

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        average_ticket:   form.average_ticket   ? Number(form.average_ticket)   : undefined,
        mrr:              form.mrr               ? Number(form.mrr)               : undefined,
        churn_rate:       form.churn_rate        ? Number(form.churn_rate)        : undefined,
        cac:              form.cac               ? Number(form.cac)               : undefined,
        ltv:              form.ltv               ? Number(form.ltv)               : undefined,
        monthly_revenue:  form.monthly_revenue   ? Number(form.monthly_revenue)   : undefined,
        gross_margin:     form.gross_margin      ? Number(form.gross_margin)      : undefined,
        max_capacity:     form.max_capacity      ? Number(form.max_capacity)      : undefined,
        gmv:              form.gmv               ? Number(form.gmv)               : undefined,
        take_rate:        form.take_rate         ? Number(form.take_rate)         : undefined,
        active_customers: form.active_customers  ? Number(form.active_customers)  : undefined,
        icp_defined:      form.icp_defined === 'yes',
      }

      const res = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Erro ao processar diagnóstico')
      const data = await res.json()
      setDiagnosis(data)

      // Refresh session so middleware picks up onboarding_completed in JWT
      const supabase = createClient()
      await supabase.auth.refreshSession()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
      setLoading(false)
    }
  }

  async function confirm() {
    router.push('/board')
  }

  const progress = diagnosis ? 100 : ((step - 1) / STEPS.length) * 100

  // ── Loading screen ──
  if (loading && !diagnosis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF9] px-6">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#2B1A07]">
          <span className="font-curia-rounded text-xl text-white">C</span>
        </div>
        <div className="flex gap-1.5 mb-6">
          {[0,1,2].map(i => (
            <div key={i} className="h-2 w-2 rounded-full bg-[#FF6F1E] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-sm text-[#2B1A07]/60 text-center transition-all duration-500">{LOADING_MSGS[loadingMsgIdx]}</p>
      </div>
    )
  }

  const stepInfo = STEPS[step - 1] ?? STEPS[4]

  return (
    <div className="relative min-h-screen bg-[#FDFBF9] px-6 py-10 overflow-hidden">
      {/* Glow — consistente com AuthForm */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#FF6F1E] opacity-[0.06] blur-3xl -translate-y-24" />
      </div>

      <div className="relative mx-auto max-w-lg">

        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="font-curia-rounded text-4xl text-[#2B1A07]">Curia</span>
        </div>

        {/* Returning user banner */}
        {isReturning && !diagnosis && (
          <div className="mb-6 rounded-xl border border-[#FF6F1E]/20 bg-[#FF6F1E]/06 px-4 py-3 text-center">
            <p className="font-curia-serif text-sm text-[#2B1A07]/80">
              Vamos continuar de onde você parou e montar seu Board. 👋
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-8 h-1 w-full rounded-full bg-[#2B1A07]/10">
          <div
            className="h-1 rounded-full bg-[#FF6F1E] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#2B1A07]/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            {!diagnosis && (
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2B1A07]/40">
                {step} de {STEPS.length}
              </span>
            )}
            <h1 className="mt-1 font-curia-rounded text-2xl text-[#2B1A07]">
              {diagnosis ? 'Diagnóstico da Curia' : stepInfo.title}
            </h1>
            <p className="mt-1 text-sm text-[#2B1A07]/60">
              {diagnosis ? `Aqui está o que identificamos sobre a ${form.company_name}.` : stepInfo.subtitle}
            </p>
          </div>

          {/* Step content */}
          {!diagnosis && (
            <>
              {step === 1 && <Step1 form={form} update={update} />}
              {step === 2 && <Step2 form={form} update={update} />}
              {step === 3 && <Step3 form={form} update={update} />}
              {step === 4 && <Step4 form={form} update={update} />}
              {step === 5 && <Step5 form={form} update={update} />}
            </>
          )}

          {diagnosis && <DiagnosisView diagnosis={diagnosis} onConfirm={confirm} />}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="font-curia-serif text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Nav buttons */}
          {!diagnosis && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-[#2B1A07]/60 hover:text-[#2B1A07] disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed(step, form)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#2B1A07] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canProceed(5, form)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#FF6F1E] px-5 py-2 text-sm font-semibold text-[#2B1A07] hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  Gerar diagnóstico <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
