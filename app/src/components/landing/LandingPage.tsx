'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FloatingNav } from '@/components/ui/floating-navbar'
import { QuotesCarousel } from '@/components/ui/quotes-carousel'
import { ScrollTimeline } from '@/components/ui/scroll-timeline'
import { NoWidows, noWidows } from '@/components/ui/no-widows'
import { CuriaChambra } from '@/components/board/chamber/CuriaChambra'

// ─── Hero Demo — animated fake product ───────────────────────────────────────

const DEMO_Q = 'Nosso churn subiu para 8% este mês. Quais são as causas mais prováveis?'
const DEMO_R = 'Três vetores dominam esse padrão: onboarding incompleto nos primeiros 7 dias responde por ~60% dos cancelamentos. Clientes que não ativam a função principal churnam 3× mais rápido. Ausência de check-in estruturado nas contas acima de R$500/mês. Priorize nessa ordem antes de qualquer campanha de retenção.'
const DEMO_CONVOS = ['Análise de churn Q1', 'Estratégia de expansão', 'Review financeiro', 'Posicionamento de marca']
const DEMO_BOARDS = [
  { name: 'Estratégia', cls: 'bg-[#FF6F1E]' },
  { name: 'Finanças',   cls: 'bg-emerald-600' },
  { name: 'Produto',    cls: 'bg-blue-600' },
  { name: 'Crescimento',cls: 'bg-purple-600' },
]

type DemoPhase = 'idle' | 'typing' | 'thinking' | 'counselors' | 'streaming' | 'done'

function HeroDemo() {
  const [phase, setPhase]           = useState<DemoPhase>('idle')
  const [typed, setTyped]           = useState('')
  const [counselors, setCounselors] = useState(0)
  const [streamed, setStreamed]      = useState('')
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true

    function go() {
      if (!alive.current) return
      setPhase('idle'); setTyped(''); setCounselors(0); setStreamed('')

      // 1 — start typing
      const t1 = setTimeout(() => {
        if (!alive.current) return
        setPhase('typing')
        let i = 0
        const tick = setInterval(() => {
          if (!alive.current) { clearInterval(tick); return }
          i++
          setTyped(DEMO_Q.slice(0, i))
          if (i >= DEMO_Q.length) {
            clearInterval(tick)
            // 2 — submitted → thinking
            setTimeout(() => {
              if (!alive.current) return
              setPhase('thinking'); setTyped('')
              // 3 — counselors appear
              setTimeout(() => {
                if (!alive.current) return
                setPhase('counselors')
                DEMO_BOARDS.forEach((_, idx) => {
                  setTimeout(() => {
                    if (!alive.current) return
                    setCounselors(idx + 1)
                  }, idx * 380)
                })
                // 4 — stream response
                const streamDelay = DEMO_BOARDS.length * 380 + 700
                setTimeout(() => {
                  if (!alive.current) return
                  setPhase('streaming')
                  const words = DEMO_R.split(' ')
                  let w = 0
                  const stream = setInterval(() => {
                    if (!alive.current) { clearInterval(stream); return }
                    w++
                    setStreamed(words.slice(0, w).join(' '))
                    if (w >= words.length) {
                      clearInterval(stream)
                      setPhase('done')
                      setTimeout(go, 3500)
                    }
                  }, 55)
                }, streamDelay)
              }, 900)
            }, 500)
          }
        }, 32)
      }, 1200)
      return t1
    }

    const t = go()
    return () => { alive.current = false; clearTimeout(t) }
  }, [])

  const showQuestion  = phase !== 'idle'
  const showThinking  = phase === 'thinking'
  const showCounselors= ['counselors','streaming','done'].includes(phase)
  const showResponse  = ['streaming','done'].includes(phase)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2B1A07]/12 shadow-2xl" style={{ background: '#FDFBF9' }}>
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-[#2B1A07]/10 bg-[#F5EDE0]/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/70" />
          <div className="h-3 w-3 rounded-full bg-amber-300/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
        </div>
        <span className="mx-auto font-curia-serif text-xs text-[#2B1A07]/50">Curia — Board Room</span>
      </div>

      {/* App layout */}
      <div className="flex" style={{ height: '420px' }}>

        {/* Sidebar */}
        <div className="flex w-44 shrink-0 flex-col border-r border-[#2B1A07]/08" style={{ background: '#1C0F06' }}>
          <div className="px-3 pt-4 pb-2">
            <p className="font-curia-serif text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Conversas</p>
          </div>
          {DEMO_CONVOS.map((c, i) => (
            <div
              key={c}
              className={`mx-2 mb-0.5 rounded-lg px-2.5 py-2 transition-all ${i === 0 ? 'bg-[#FF6F1E]/20' : ''}`}
            >
              <p className={`font-curia-serif text-xs leading-tight ${i === 0 ? 'text-white/90' : 'text-white/35'}`}>
                {c}
              </p>
            </div>
          ))}
        </div>

        {/* Main chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-hidden px-5 py-5">

            {/* User message */}
            {showQuestion && (
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#2B1A07] px-4 py-2.5">
                  <p className="font-curia-serif text-xs leading-relaxed text-white/90">{DEMO_Q}</p>
                </div>
              </div>
            )}

            {/* Thinking indicator */}
            {showThinking && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#FF6F1E]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="font-curia-serif text-xs text-[#2B1A07]/40">Board deliberando...</p>
              </div>
            )}

            {/* Counselors */}
            {showCounselors && (
              <div className="flex flex-wrap gap-1.5">
                {DEMO_BOARDS.slice(0, counselors).map(b => (
                  <div key={b.name} className="flex items-center gap-1.5 rounded-full border border-[#2B1A07]/10 bg-white px-2.5 py-1 shadow-sm">
                    <div className={`h-2 w-2 rounded-full ${b.cls}`} />
                    <span className="font-curia-serif text-[10px] font-medium text-[#2B1A07]/70">{b.name}</span>
                    {phase !== 'done' && <div className="h-1.5 w-1.5 animate-spin rounded-full border border-[#2B1A07]/20 border-t-[#2B1A07]/60" />}
                    {phase === 'done' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </div>
                ))}
              </div>
            )}

            {/* AI response */}
            {showResponse && (
              <div className="max-w-[85%]">
                <p className="font-curia-serif text-xs leading-relaxed text-[#2B1A07]/80">
                  {streamed}
                  {phase === 'streaming' && <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-[#2B1A07]/60" />}
                </p>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-[#2B1A07]/08 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#2B1A07]/15 bg-white px-3 py-2 shadow-sm">
              <p className="flex-1 font-curia-serif text-xs text-[#2B1A07]/80">
                {typed}
                {phase === 'typing' && <span className="ml-px inline-block h-3 w-px animate-pulse bg-[#2B1A07]/60" />}
                {phase === 'idle' && <span className="text-[#2B1A07]/30">Pergunte ao seu Board...</span>}
              </p>
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${phase === 'typing' && typed.length > 5 ? 'bg-[#FF6F1E]' : 'bg-[#2B1A07]/10'}`}>
                <ArrowRight className={`h-3 w-3 ${phase === 'typing' && typed.length > 5 ? 'text-white' : 'text-[#2B1A07]/40'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Board Mockup — home state sem sidebar ────────────────────────────────────

function ChamberSVG({ className = 'w-full max-w-[260px]' }: { className?: string }) {
  // 6 posições de assento ao redor da mesa isométrica
  const seats = [
    { cx: 150, cy: 52  }, // topo
    { cx: 210, cy: 76  }, // topo-direita
    { cx: 210, cy: 128 }, // baixo-direita
    { cx: 150, cy: 154 }, // baixo
    { cx: 90,  cy: 128 }, // baixo-esquerda
    { cx: 90,  cy: 76  }, // topo-esquerda
  ]

  return (
    <svg viewBox="0 0 300 210" className={className} aria-hidden>
      <defs>
        <radialGradient id="mg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FF6F1E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FF6F1E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fg" cx="50%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#F8F0E6" />
          <stop offset="100%" stopColor="#EDD9BF" />
        </radialGradient>
      </defs>

      {/* Plataforma isométrica — face superior */}
      <path d="M 150 35 L 268 98 L 150 162 L 32 98 Z"
            fill="url(#fg)" stroke="#2B1A07" strokeOpacity="0.08" strokeWidth="1" />

      {/* Face lateral direita */}
      <path d="M 268 98 L 150 162 L 150 192 L 268 128 Z"
            fill="#DFC8A8" stroke="none" />

      {/* Face lateral esquerda */}
      <path d="M 32 98 L 150 162 L 150 192 L 32 128 Z"
            fill="#CEB895" stroke="none" />

      {/* Linha divisória plataforma */}
      <line x1="150" y1="162" x2="150" y2="192" stroke="#2B1A07" strokeOpacity="0.06" strokeWidth="1" />

      {/* Mesa central (oval isométrica) */}
      <ellipse cx="150" cy="98" rx="48" ry="28"
               fill="#2B1A07" fillOpacity="0.05"
               stroke="#2B1A07" strokeOpacity="0.12" strokeWidth="1"
               transform="rotate(-0 150 98)" />

      {/* Glow central */}
      <circle cx="150" cy="98" r="34" fill="url(#mg)" />
      <circle cx="150" cy="98" r="12" fill="#FF6F1E" fillOpacity="0.18" />
      <circle cx="150" cy="98" r="5"  fill="#FF6F1E" fillOpacity="0.6" />

      {/* Assentos dos conselheiros */}
      {seats.map((s, i) => (
        <g key={i}>
          <circle cx={s.cx} cy={s.cy} r={7}
                  fill="#2B1A07" fillOpacity="0.85"
                  stroke="#FF6F1E" strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx={s.cx} cy={s.cy} r={2.5}
                  fill="#FF6F1E" fillOpacity="0.6" />
        </g>
      ))}
    </svg>
  )
}

function BoardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2B1A07]/15 bg-[#FDFBF9] shadow-2xl">
      {/* Chrome */}
      <div className="flex items-center gap-2 border-b border-[#2B1A07]/10 bg-[#F5EDE0]/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="mx-auto font-curia-serif text-xs text-[#2B1A07]/50">Curia — Board Room</span>
      </div>

      {/* App body */}
      <div className="flex flex-col items-center px-6 pb-5 pt-7" style={{ minHeight: 360 }}>

        {/* Saudação */}
        <div className="mb-5 text-center">
          <h3 className="font-curia-rounded text-xl text-[#2B1A07] md:text-2xl">Olá, Empresário</h3>
          <p className="mt-1 font-curia-serif text-sm text-[#2B1A07]/50">O que você deseja resolver hoje?</p>
        </div>

        {/* Câmara isométrica */}
        <div className="flex flex-1 items-center justify-center py-2">
          <ChamberSVG />
        </div>

        {/* Input */}
        <div className="mt-4 w-full">
          <div className="flex items-center gap-2 rounded-xl border border-[#2B1A07]/15 bg-white px-4 py-3 shadow-sm">
            <span className="flex-1 font-curia-serif text-sm text-[#2B1A07]/30">
              Apresente seu desafio ao Board...
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2B1A07]/08">
              <ArrowRight className="h-3.5 w-3.5 text-[#2B1A07]/35" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function CuriaLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'text-3xl' : 'text-4xl'
  return (
    <div className="flex items-center">
      <span className={`font-curia-rounded text-[#2B1A07] ${sizeClass} leading-none`}>
        Curia
      </span>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF9] text-[#2B1A07]">
      <Nav />
      <Hero />
      <MeetCuria />
      <HowItWorks />
      <Authority />
      <BigTechs />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { name: 'Conheça',        link: '#conheca' },
  { name: 'Como funciona',  link: '#como-funciona' },
  { name: 'Autoridade',     link: '#autoridade' },
  { name: 'Big Techs',      link: '#big-techs' },
]

function Nav() {
  return (
    <>
      {/* Static top bar — visible at the top of the page */}
      <header className="relative z-40 px-6 bg-[#FDFBF9]">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between">
          <CuriaLogo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button size="md" className="bg-[#2B1A07] text-white hover:opacity-90">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button size="md" className="bg-[#FF6F1E] text-[#2B1A07] hover:opacity-90">
                Montar meu Board <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Floating pill — appears when scrolling back up */}
      <FloatingNav
        navItems={NAV_ITEMS}
        brand={<CuriaLogo size="sm" />}
        cta={
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="rounded-full bg-[#2B1A07] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                Entrar
              </button>
            </Link>
            <Link href="/signup">
              <button className="rounded-full bg-[#FF6F1E] px-4 py-1.5 text-sm font-semibold text-[#2B1A07] hover:opacity-90 transition-opacity">
                Montar meu Board
              </button>
            </Link>
          </div>
        }
      />
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
      {/* Glow background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-[#FF6F1E] opacity-[0.07] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Toggle-like label (tertiary font) */}
        <div className="mb-6 inline-flex items-center">
          <span className="font-curia-script text-xl md:text-2xl tracking-wide text-[#FF6F1E]">
            Acesso antecipado — vagas limitadas
          </span>
        </div>

        {/* H1 */}
        <h1 className="mb-6 text-4xl leading-[1.1] text-[#2B1A07] md:text-6xl font-curia-rounded">
          <span className="block mx-auto max-w-[32ch]">
            <NoWidows>Os conselheiros estratégicos das grandes empresas —</NoWidows>{' '}
            <span className="font-curia-script text-[#FF6F1E]">no seu computador.</span>
          </span>
        </h1>

        {/* Oferta */}
        <p className="mx-auto mb-10 font-curia-serif text-sm text-[#2B1A07]/50">
          14 dias grátis · Sem cartão de crédito
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href="#como-funciona">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver como funciona
            </Button>
          </a>
          <a href="#fortalecer-decisoes">
            <Button size="lg" className="w-full sm:w-auto bg-[#FF6F1E] text-[#2B1A07] hover:opacity-90">
              Montar meu board <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* Live product demo */}
      <div className="relative mx-auto mt-16 max-w-3xl">
        <HeroDemo />
      </div>
    </section>
  )
}

// ─── Authority — Quotes Carousel ──────────────────────────────────────────────

const QUOTES = [
  {
    quote: 'Questione cada premissa. A maioria do que consideramos inevitável é apenas convencional.',
    author: 'Elon Musk',
    company: 'Tesla · SpaceX',
    image: '/elon-musk.jpeg',
  },
  {
    quote: 'O que não é questionado não é compreendido. O que não é compreendido não pode ser melhorado.',
    author: 'Peter Drucker',
    company: 'Pai da Administração Moderna',
    image: '/peter-drucker.jpeg',
  },
  {
    quote: 'Se você não sabe para qual porto está navegando, nenhum vento será favorável.',
    author: 'Sêneca',
    company: 'Filósofo Estoico · 4 a.C – 65 d.C',
    image: '/seneca.jpeg',
  },
  {
    quote: 'Aquele que não pensa longe terá problemas perto.',
    author: 'Confúcio',
    company: 'Filósofo · 551–479 a.C',
    image: '/confucio.jpeg',
  },
  {
    quote: 'O primeiro método para estimar a inteligência de um governante é olhar para os homens ao seu redor.',
    author: 'Nicolau Maquiavel',
    company: 'O Príncipe · 1513',
    image: '/nicolau-maquiavel.jpeg',
  },
  {
    quote: 'Se enxerguei mais longe, foi porque me apoiei nos ombros de gigantes.',
    author: 'Isaac Newton',
    company: 'Físico e Matemático · 1643–1727',
    image: '/isaac-newton.jpeg',
  },
  {
    quote: 'Nenhum homem é suficientemente sábio para governar a si mesmo sem o conselho de outros.',
    author: 'Cícero',
    company: 'Filósofo e Estadista · 106–43 a.C',
    image: '/cicero.jpeg',
  },
  {
    quote: 'Nas deliberações, a multidão frequentemente julga melhor do que qualquer indivíduo.',
    author: 'Aristóteles',
    company: 'Filósofo · 384–322 a.C',
    image: '/aristotle.jpeg',
  },
  {
    quote: 'Eu sempre tive pessoas ao meu redor que me disseram coisas que eu não queria ouvir. Essa foi a diferença.',
    author: 'Steve Jobs',
    company: 'Fundador da Apple · Revolucionou 6 indústrias',
    image: '/steve-jobs.jpeg',
  },
  {
    quote: 'Cerque-se de pessoas que desafiem suas decisões. O consenso mata empresas.',
    author: 'Jack Welch',
    company: 'CEO da GE · Eleito "O melhor CEO do Século"',
    image: '/jack-welch.jpeg',
  },
  {
    quote: 'Nunca construí nada sozinho. Cada grande ideia foi questionada, refinada e melhorada por alguém de fora.',
    author: 'Walt Disney',
    company: 'Fundador da Disney · Criou o maior império do entretenimento',
    image: '/walt-disney.jpeg',
  },
]

function QuoteCard({ quote, author, company, image }: typeof QUOTES[number]) {
  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-[#2B1A07]/15 shadow-2xl md:h-[600px]">
      {/* Background image — object-position foca no rosto (topo centralizado) */}
      <img
        src={image}
        alt={author}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '50% 15%' }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Glassmorphism quote panel at bottom */}
      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-[#2B1A07]/20 bg-[#2B1A07]/10 p-5 backdrop-blur-xl md:inset-x-4 md:bottom-4 md:p-6 font-curia-serif">
        <blockquote className="mb-3 text-sm font-medium leading-relaxed text-white md:text-base">
          &ldquo;{noWidows(quote)}&rdquo;
        </blockquote>
        <footer>
          <p className="text-sm font-semibold text-white">{noWidows(author)}</p>
          <p className="text-xs text-white/80">{noWidows(company)}</p>
        </footer>
      </div>
    </div>
  )
}

function AnimatedStickyHeadlines() {
  const [step, setStep] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && step === 0) {
          // Schedule reveals
          setStep(1)
          setTimeout(() => setStep(2), 1500)
          setTimeout(() => setStep(3), 1500 + 1000)
          setTimeout(() => setStep(4), 1500 + 1000 + 800)
        }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [step])

  const base = 'transition-all duration-700 ease-out will-change-transform'
  const hidden = 'opacity-0 translate-y-3'
  const shown = 'opacity-100 translate-y-0'

  return (
    <div ref={containerRef} className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl md:text-5xl font-curia-rounded text-[#2B1A07] tracking-[-0.01em] leading-tight">
        <span className={`inline-block ${base} ${step >= 1 ? shown : hidden}`}>
          <NoWidows>Pense </NoWidows>
          <CorrectionComo />
          <NoWidows> os grandes</NoWidows>
        </span>
      </h2>
    </div>
  )
}

function CorrectionComo() {
  return (
    <span className="relative inline-block px-1 align-baseline">
      <span className="relative z-0">como</span>
      {/* Orange hand-drawn X (two curved strokes) to match Curia Script style */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
      >
        {/* First stroke: left-bottom to right-top with gentle curve */}
        <path
          d="M4 18 C 28 14, 72 10, 96 6"
          fill="none"
          stroke="#FF6F1E"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Second stroke: left-top to right-bottom with gentle curve */}
        <path
          d="M4 6 C 28 10, 72 14, 96 18"
          fill="none"
          stroke="#FF6F1E"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Handwritten correction in Curia Script (same look as toggle) */}
      <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF6F1E] font-curia-script text-[1.05em] leading-none">
        com
      </span>
    </span>
  )
}

function RevealCard({ item, direction }: { item: typeof QUOTES[number]; direction: 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true)
    }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const base = 'transition-all duration-600 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-transform'
  const off = direction === 'right' ? 'translate-x-6' : '-translate-x-6'

  return (
    <div ref={ref} className={`${base} ${visible ? 'opacity-100 translate-x-0' : `opacity-0 ${off}`}`}>
      <QuoteCard {...item} />
    </div>
  )
}

function QuotesTwoColumnReveal({ slides }: { slides: typeof QUOTES }) {
  return (
    <div className="mx-auto max-w-6xl grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
      {slides.map((s, i) => {
        const dir = i % 2 === 0 ? 'right' : 'left'
        const colClass = i % 2 === 0 ? 'md:col-start-2' : 'md:col-start-1'
        return (
          <div
            key={i}
            className={colClass}
            style={{ gridRowStart: i + 1 }}
          >
            <RevealCard item={s} direction={dir as 'left' | 'right'} />
          </div>
        )
      })}
    </div>
  )
}

function QuotesStickyTwoColumn({ slides, segmentVh = 100 }: { slides: typeof QUOTES; segmentVh?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // More centered activation: 30%–70% of viewport
      const start = rect.top - vh * 0.3
      const end = rect.bottom - vh * 0.7
      const total = end - start
      if (total <= 0) return
      const raw = (-start) / total
      setProgress(Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const count = slides.length
  const height = `${count * segmentVh}vh`

  return (
    <div ref={containerRef} className="relative" style={{ height }}>
      <div className="sticky top-[30vh]">
        <div className="mx-auto max-w-3xl grid grid-cols-1 gap-y-8">
          {slides.map((s, i) => {
            const local = Math.max(0, Math.min(1, progress * count - i))
            const dir = 1 // all from right → left
            const translate = (1 - local) * 48 * dir
            const style: React.CSSProperties = {
              transform: `translateX(${translate}px) scale(${0.98 + local * 0.02})`,
              opacity: local === 0 ? 0 : local >= 1 ? 1 : Math.min(1, local * 1.5),
              transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s cubic-bezier(0.22,1,0.36,1)',
            }
            return (
              <div key={i} style={{ gridRowStart: i + 1 }}>
                <div style={style}>
                  <QuoteCard {...s} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Sticky Carousel (scroll-driven horizontal) ─────────────────────────────
function QuotesStickyCarousel({ slides, segmentVh = 120 }: { slides: typeof QUOTES; segmentVh?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const start = rect.top - vh * 0.25
      const end = rect.bottom - vh * 0.75
      const total = end - start
      if (total <= 0) return
      const raw = (-start) / total
      setProgress(Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const count = slides.length
  const height = `${Math.max(1, count) * segmentVh}vh`

  return (
    <div ref={containerRef} className="relative" style={{ height }}>
      <div className="sticky top-[20vh]">
        {/* Stage */}
        <div className="relative mx-auto flex items-center justify-center" style={{ height: 620 }}>
          {slides.map((s, i) => {
            const idx = progress * count
            const local = idx - i // [-1,0] prev → current; [0,1] current → next

            let opacity = 0
            let translateX = 0
            let scale = 0.98
            let zIndex = 0

            if (local >= 0 && local <= 1) {
              const t = local
              opacity = Math.min(1, t * 1.2)
              translateX = (1 - t) * 80 // from right → center
              scale = 0.98 + t * 0.02
              zIndex = 2
            } else if (local > -1 && local < 0) {
              const t = 1 + local // map [-1,0] → [0,1]
              opacity = Math.max(0, t * 1.0)
              translateX = -(1 - t) * 80 // center → left
              scale = 0.98 + t * 0.02
              zIndex = 1
            } else {
              opacity = 0
              translateX = 0
              scale = 0.98
              zIndex = 0
            }

            const style: React.CSSProperties = {
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
              opacity,
              transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease',
              width: 'min(560px, 92vw)',
              zIndex,
              pointerEvents: opacity > 0.1 ? 'auto' : 'none',
            }
            return (
              <div key={i} style={style}>
                <QuoteCard {...s} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Authority() {
  const hidden = new Set(['Confúcio', 'Sêneca', 'Peter Drucker', 'Elon Musk'])
  const visible = QUOTES.filter((q) => !hidden.has(q.author))

  return (
    <section id="autoridade" className="bg-[#FDFBF9] px-6 py-24 overflow-hidden">
      <div className="mx-auto max-w-5xl">
        <AnimatedStickyHeadlines />
        <div className="mt-12" />
        <QuotesCarousel slides={visible.map((q, i) => <QuoteCard key={i} {...q} />)} autoplay autoplayDelay={2600} showArrows={false} showIndicators />
      </div>
    </section>
  )
}

// ─── Meet Curia ──────────────────────────────────────────────────────────────

function BoardHomePreview() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Chamber with greeting overlay — mirrors board home state exactly */}
      <div className="relative w-full" style={{ height: 300 }}>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 z-10">
          <span className="font-curia-script text-[#FF6F1E] text-3xl md:text-4xl leading-none">
            Olá, Empresário
          </span>
        </div>
        <CuriaChambra state="idle" />
      </div>

      {/* Subtitle — larger, primary color */}
      <p className="mt-3 font-curia-rounded text-xl md:text-2xl text-[#FF6F1E] text-center">
        O que você deseja resolver hoje?
      </p>

      {/* Static input bar — CouncilInput home style */}
      <div className="mt-5 w-full max-w-md">
        <div className="council-input-box pointer-events-none select-none" style={{ opacity: 0.85 }}>
          <textarea
            readOnly
            rows={2}
            className="council-textarea council-textarea-home"
            placeholder="Conte-nos o seu maior desafio, vamos resolvê-lo juntos."
            style={{ resize: 'none' }}
          />
          <div className="council-input-footer">
            <div className="council-input-tools">
              <span className="council-model-badge inline-flex items-center gap-1 text-xs">
                Curia Strategist
              </span>
            </div>
            <div className="council-send-round opacity-30">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MeetCuria() {
  return (
    <section id="conheca" className="bg-[#FDFBF9] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">

          {/* Left: Copy */}
          <div>
            <h2 className="mb-5 text-3xl font-curia-rounded text-[#2B1A07] md:text-5xl tracking-[-0.02em]"><NoWidows>Conheça a Curia</NoWidows></h2>
            <p className="text-lg leading-relaxed text-[#2B1A07]/80 font-curia-serif">
              <NoWidows>Curia é o seu conselho consultivo de IA, disponível 24 horas por dia. Estratégico, preciso e sempre pronto para orientar suas decisões.</NoWidows>
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[#2B1A07]/70 font-curia-serif">
              <NoWidows>Criada para dar a empresas em crescimento o mesmo nível de inteligência que antes só as grandes tinham acesso.</NoWidows>
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a href="#como-funciona">
                <Button variant="outline" size="lg">Ver como funciona</Button>
              </a>
              <Link href="/signup">
                <Button size="lg" className="bg-[#FF6F1E] text-[#2B1A07] hover:opacity-90">
                  Montar meu board <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Board home UI (no card frame) */}
          <div className="relative">
            <BoardHomePreview />
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    number: '01',
    title: 'Monte seu Board',
    description:
      'Escolha os conselheiros que fazem sentido para o seu modelo de negócio.',
  },
  {
    number: '02',
    title: 'Apresente seu negócio',
    description:
      'Seus conselheiros debatem com você, questionam suas premissas, te faz enxergar o que você não via.',
  },
  {
    number: '03',
    title: 'Cresça como uma Big Tech',
    description:
      'Mostre seus desafios. Conte suas barreiras. Cresça como uma Big Tech.',
  },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#FDFBF9] px-6 pt-28 pb-24">
      <div className="mx-auto max-w-5xl">
        {/* 2-column layout: sticky title left + scrolling timeline right */}
        <div className="flex flex-col gap-16 md:flex-row md:gap-20 md:items-start">

          {/* Left — sticky title */}
          <div className="md:sticky md:top-32 md:w-80 md:shrink-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#2B1A07]/60">
              Processo
            </p>
            <h2 className="mb-4 text-3xl font-curia-rounded leading-tight text-[#2B1A07] md:text-5xl tracking-[-0.02em]"><NoWidows>Como funciona</NoWidows></h2>
            <p className="text-base leading-relaxed text-[#2B1A07]/70 font-curia-serif">
              <NoWidows>Três passos para ter um board estratégico operando no seu negócio.</NoWidows>
            </p>

            {/* Decorative rule */}
            <div className="mt-8 h-px w-12 bg-[#2B1A07]/40" />
          </div>

          {/* Right — scrolling timeline */}
          <div className="flex-1">
            <ScrollTimeline steps={HOW_STEPS} />
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── Big Techs — Two-Line Marquee ───────────────────────────────────────────

function BigTechs() {
  const LOGOS = [
    'apple','google','netflix','meta','stripe','openai','tesla','spotify',
    'airbnb','uber','github','shopify','notion','figma','zoom','youtube'
  ]

  const rotate = <T,>(arr: T[], offset: number) => arr.slice(offset).concat(arr.slice(0, offset))

  const makeColumn = (index: number) => {
    const extended = [...LOGOS, ...LOGOS, ...LOGOS]
    // 12 itens por coluna, com deslocamento para variar
    const items = rotate(extended, index * 2).slice(0, 12)
    // duplicado para loop perfeito
    return [...items, ...items]
  }

  const columns = Array.from({ length: 10 }, (_, i) => makeColumn(i))

  return (
    <section id="big-techs" className="bg-[#FDFBF9] px-6 py-24 overflow-hidden">
      <style>{`
        @keyframes ticker-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes ticker-down { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
      `}</style>

      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mb-16 text-5xl md:text-7xl font-curia-rounded text-[#2B1A07] tracking-[-0.02em] leading-tight">
          <span className="block"><NoWidows>Jogue no nível de</NoWidows></span>
          <span className="block">
            <span>quem você </span>
            <span className="font-curia-script text-[#FF6F1E]">se inspira</span>
          </span>
        </h2>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {columns.map((col, i) => (
            <div key={`col-${i}`} className="relative overflow-hidden h-[420px]">
              {/* Fades */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[#FDFBF9] to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#FDFBF9] to-transparent" />

              <div
                className="flex flex-col items-center gap-6"
                style={{ animation: `${i % 2 === 0 ? 'ticker-up' : 'ticker-down'} ${32 + (i % 3) * 4}s linear infinite` }}
              >
                {col.map((slug, j) => (
                  <div key={`cell-${i}-${j}`} className="opacity-[0.45] transition-opacity hover:opacity-90">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/logos/${slug}.svg`} alt={slug} width={28} height={28} className="h-7 w-7 filter invert" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

// ─── Pricing ──────────────────────────────────────────────────────────────────

const STARTER_FEATURES = [
  'Board estratégico completo',
  '6 conselheiros de IA especializados',
  'Diagnóstico de empresa no onboarding',
  'Consultas ilimitadas',
  'Histórico de conversas',
]

function Pricing() {
  return (
    <section id="planos" className="bg-[#FDFBF9] px-6 py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#2B1A07]/60">Planos</p>
        <h2 className="mb-4 text-3xl font-curia-rounded text-[#2B1A07] md:text-5xl tracking-[-0.02em]">
          <NoWidows>Comece agora, sem risco</NoWidows>
        </h2>
        <p className="mb-14 text-lg text-[#2B1A07]/70 font-curia-serif">
          <NoWidows>14 dias grátis · Sem cartão de crédito · Cancele quando quiser</NoWidows>
        </p>

        {/* Single card — Starter */}
        <div className="mx-auto max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-[#2B1A07]/12 bg-white px-8 py-10 shadow-lg shadow-[#2B1A07]/06">
            {/* Badge */}
            <span className="mb-6 inline-block rounded-full bg-[#FF6F1E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF6F1E]">
              Curia Starter
            </span>

            {/* Price */}
            <div className="mb-2 flex items-end justify-center gap-1">
              <span className="font-curia-rounded text-6xl text-[#2B1A07]">R$0</span>
            </div>
            <p className="mb-8 font-curia-serif text-sm text-[#2B1A07]/50">Grátis para sempre</p>

            {/* CTA */}
            <Link href="/signup" className="block w-full">
              <Button size="lg" className="w-full bg-[#FF6F1E] text-[#2B1A07] hover:opacity-90">
                Criar minha conta <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            {/* Features */}
            <ul className="mt-8 space-y-3 text-left">
              {STARTER_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-3 font-curia-serif text-sm text-[#2B1A07]/80">
                  <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6F1E]" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.3" />
                    <path d="M4.5 8l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>

            {/* Glow accent */}
            <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#FF6F1E] opacity-[0.06] blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section id="fortalecer-decisoes" className="relative overflow-hidden px-6 py-28 text-center">
      {/* Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-[hsl(var(--secondary))] opacity-[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl">
        <h2 className="mb-4 text-4xl font-curia-serif-display tracking-tight text-[#2B1A07] md:text-5xl"><NoWidows>Fortaleça suas decisões</NoWidows></h2>
        <p className="mb-10 text-lg text-[#2B1A07]/70 font-curia-serif">
          <NoWidows>14 dias grátis · Sem cartão de crédito</NoWidows>
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-[#FF6F1E] text-[#2B1A07] hover:opacity-90">
            Montar meu Board agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="mt-4 text-xs text-[#2B1A07]/60 font-curia-serif">
          <NoWidows>Leva menos de 2 minutos</NoWidows>
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#FDFBF9] px-6">
      <div className="mx-auto max-w-7xl">
        {/* Top content */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <CuriaLogo size="sm" />
            <p className="text-sm text-[#2B1A07]/70">
              Onde boas empresas se tornam ótimas.
            </p>
          </div>

          {/* Produto */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2B1A07]/60 mb-3">Produto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#como-funciona" className="text-[#2B1A07]/80 hover:text-[#2B1A07] transition-colors">Como funciona</a>
              </li>
              <li>
                <Link href="/login" className="text-[#2B1A07]/80 hover:text-[#2B1A07] transition-colors">Entrar</Link>
              </li>
              <li>
                <Link href="/signup" className="text-[#2B1A07]/80 hover:text-[#2B1A07] transition-colors">Começar agora</Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2B1A07]/60 mb-3">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/board" className="text-[#2B1A07]/80 hover:text-[#2B1A07] transition-colors">Board</Link>
              </li>
              <li>
                <a href="#" className="text-[#2B1A07]/80 hover:text-[#2B1A07] transition-colors">Guia rápido</a>
              </li>
              <li>
                <a href="mailto:hello@curia.app" className="text-[#2B1A07]/80 hover:text-[#2B1A07] transition-colors">Contato</a>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2B1A07]/60 mb-3">Começar</h3>
            <p className="text-sm text-[#2B1A07]/70 mb-4 font-curia-serif">Leva menos de 2 minutos.</p>
            <Link href="/signup">
              <Button size="md" className="bg-[#FF6F1E] text-[#2B1A07] hover:opacity-90 w-full sm:w-auto">
                Montar meu board
              </Button>
            </Link>
          </div>
        </div>

        {/* Divider */}
        

        {/* Bottom bar */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-[#2B1A07]/60">© {new Date().getFullYear()} Curia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-[#2B1A07]/60">
            {/* X */}
            <a href="#" aria-label="X / Twitter" className="hover:text-[#2B1A07] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18 2h3l-7.5 8.5L22 22h-6l-4.5-6L6 22H3l8.1-9.2L2 2h6l4 5.3L18 2z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" className="hover:text-[#2B1A07] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.1c.5-1 1.8-2.2 3.7-2.2 4 0 4.8 2.6 4.8 6V24h-4v-5.8c0-1.4 0-3.2-2-3.2s-2.3 1.6-2.3 3.1V24h-4V8z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" aria-label="YouTube" className="hover:text-[#2B1A07] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.5 6.2s-.2-1.7-.8-2.5c-.8-.8-1.7-.8-2.1-.9C17.8 2.5 12 2.5 12 2.5h0s-5.8 0-8.6.3c-.4 0-1.3.1-2.1.9-.6.8-.8 2.5-.8 2.5S0 8.3 0 10.5v2.9c0 2.2.2 4.3.2 4.3s.2 1.7.8 2.5c.8.8 1.9.8 2.4.9 1.8.2 7.6.3 7.6.3s5.8 0 8.6-.3c.4 0 1.3-.1 2.1-.9.6-.8.8-2.5.8-2.5s.2-2.1.2-4.3v-2.9c0-2.2-.2-4.3-.2-4.3zM9.5 14.8V7.7l6.4 3.5-6.4 3.6z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="hover:text-[#2B1A07] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.3 2.4.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.5.4 1.2.5 2.4.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.3 1.9-.5 2.4-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.5.2-1.2.4-2.4.5-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.3-2.4-.5-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.5-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.3-1.9.5-2.4.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.1 0-3.5 0-4.7.1-1 .1-1.5.2-1.9.3-.5.2-.8.3-1 .6-.3.3-.5.6-.6 1-.1.4-.3.9-.3 1.9-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.5.3 1.9.1.4.3.8.6 1 .3.3.6.5 1 .6.4.1.9.3 1.9.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.5-.2 1.9-.3.4-.1.8-.3 1-.6.3-.3.6-.5 1-.6.1-.4.3-.9.3-1.9.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.5-.3-1.9-.1-.4-.3-.8-.6-1-.3-.3-.6-.5-1-.6-.4-.1-.9-.3-1.9-.3-1.2-.1-1.6-.1-4.7-.1zM12 5.9a6.1 6.1 0 1 1 0 12.2 6.1 6.1 0 0 1 0-12.2m0 1.8a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6M18.4 4.9a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

