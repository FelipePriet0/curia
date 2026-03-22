'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FloatingNav } from '@/components/ui/floating-navbar'
import { QuotesCarousel } from '@/components/ui/quotes-carousel'
import { ScrollTimeline } from '@/components/ui/scroll-timeline'
import { NoWidows, noWidows } from '@/components/ui/no-widows'

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
        <h1 className="mb-6 text-5xl leading-[1.05] text-[#2B1A07] md:text-7xl font-curia-rounded">
          <span className="block mx-auto max-w-[18ch]"><NoWidows>O conselho de toda</NoWidows></span>
          <span className="block mx-auto max-w-[28ch] md:whitespace-nowrap text-[#2B1A07]"><NoWidows>empresa de sucesso,</NoWidows></span>
          <span className="block mx-auto max-w-[32ch] font-curia-script text-[#FF6F1E]"><NoWidows>no seu computador</NoWidows></span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#2B1A07]/70 font-curia-serif">
          <span className="block"><NoWidows>Grandes empresas pagam milhões por conselheiros estratégicos.</NoWidows></span>
          <span className="block"><NoWidows>Agora você também tem — com orçamento de startup.</NoWidows></span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href="#como-funciona">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver como funciona
            </Button>
          </a>
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto bg-[#FF6F1E] text-[#2B1A07] hover:opacity-90">
              Montar meu board <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Video demo placeholder */}
      <div className="relative mx-auto mt-16 max-w-3xl">
        <div className="overflow-hidden rounded-[var(--brand-radius-xl)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[hsl(var(--brand-danger))] opacity-70" />
              <div className="h-3 w-3 rounded-full bg-[hsl(var(--brand-warning))] opacity-70" />
              <div className="h-3 w-3 rounded-full bg-[hsl(var(--brand-success))] opacity-70" />
            </div>
                <span className="mx-auto text-xs text-[#2B1A07]/60">Curia — Board Room</span>
          </div>
          {/* Video placeholder — substituir por <video> ou <iframe> */}
          <div className="flex aspect-video items-center justify-center bg-[hsl(var(--muted))]">
            <div className="flex flex-col items-center gap-3 text-[#2B1A07]/60">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <svg className="h-6 w-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-sm">Demo em breve</span>
            </div>
          </div>
        </div>
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

function MeetCuria() {
  return (
    <section id="conheca" className="bg-[#FDFBF9] px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
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

          {/* Right: Product Video (SV style) */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[var(--brand-radius-xl)] border border-[#2B1A07]/15 bg-[#2B1A07]/5 shadow-2xl">
              {/* Subtle gradient backdrop */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]" />

              {/* Top chrome */}
              <div className="relative z-10 flex items-center gap-2 border-b border-[#2B1A07]/15 bg-[#2B1A07]/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <span className="mx-auto text-xs text-[#2B1A07]/70">Curia — Product Video</span>
              </div>

              {/* Video area */}
              <div className="relative z-10">
                <div className="aspect-video bg-black/60">
                  {/* Replace the placeholder below with your video or iframe when ready */}
                  {/* Example: <video src="/videos/curia-demo.mp4" controls className="h-full w-full object-cover" /> */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      aria-label="Play video"
                      className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2B1A07]/30 bg-[#2B1A07]/10 text-[#2B1A07] transition hover:scale-105 hover:bg-[#2B1A07]/15"
                    >
                      <svg className="h-7 w-7 translate-x-0.5 opacity-90 transition group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Soft shadow */}
            <div aria-hidden className="absolute -inset-x-6 -bottom-6 h-12 bg-gradient-to-b from-transparent to-black/40 blur-2xl" />
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

function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-28 text-center">
      {/* Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-[hsl(var(--secondary))] opacity-[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl">
        <h2 className="mb-4 text-4xl font-curia-serif-display tracking-tight text-[#2B1A07] md:text-5xl"><NoWidows>Fortaleça suas decisões</NoWidows></h2>
        <p className="mb-10 text-lg text-[#2B1A07]/70 font-curia-serif">
          <NoWidows>Acesso gratuito. Sem formulários, sem setup.</NoWidows>
        </p>
        <Link href="/signup">
          <Button size="lg">
            Montar meu Board agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="mt-4 text-xs text-[#2B1A07]/60 font-curia-serif">
          <NoWidows>Sem cartão de crédito · Leva menos de 2 minutos</NoWidows>
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
                <a href="#pricing" className="text-[#2B1A07]/80 hover:text-[#2B1A07] transition-colors">Pricing</a>
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
              <Button size="sm" className="w-full sm:w-auto">Criar minha conta</Button>
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

// ─── Pricing ─────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="bg-[#FDFBF9] px-6 py-28">
      <div className="mx-auto max-w-6xl text-center font-curia-serif">
        <h2 className="mb-3 text-3xl font-curia-rounded text-[#2B1A07] md:text-5xl tracking-[-0.02em]"><NoWidows>Pricing</NoWidows></h2>
        <p className="mx-auto mb-12 max-w-2xl text-[#2B1A07]/70">
          <NoWidows>Escolha um plano que funciona para o seu estágio.</NoWidows>
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Starter */}
          <div className="rounded-2xl border border-[#2B1A07]/15 bg-[#2B1A07]/5 p-6 text-left">
            <h3 className="text-lg font-semibold text-[#2B1A07]"><NoWidows>Starter</NoWidows></h3>
            <p className="mt-1 text-sm text-[#2B1A07]/70"><NoWidows>Para começar com o básico.</NoWidows></p>
            <p className="mt-6 text-3xl font-bold text-[#2B1A07]">R$0<span className="text-base font-medium text-[#2B1A07]/70">/mês</span></p>
            <ul className="mt-6 space-y-2 text-sm text-[#2B1A07]/80">
              <li>• 1 Board</li>
              <li>• Mensagens limitadas</li>
              <li>• Sem cartão de crédito</li>
            </ul>
            <Link href="/signup" className="mt-6 inline-block">
              <Button className="w-full">Começar</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-[#2B1A07]/15 bg-[#2B1A07]/10 p-6 text-left ring-1 ring-[#2B1A07]/10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#2B1A07]/10 px-3 py-1 text-xs font-semibold text-[#2B1A07]/80">
              Mais popular
            </div>
            <h3 className="text-lg font-semibold text-[#2B1A07]"><NoWidows>Pro</NoWidows></h3>
            <p className="mt-1 text-sm text-[#2B1A07]/70"><NoWidows>Para operar com mais intensidade.</NoWidows></p>
            <p className="mt-6 text-3xl font-bold text-[#2B1A07]">R$99<span className="text-base font-medium text-[#2B1A07]/70">/mês</span></p>
            <ul className="mt-6 space-y-2 text-sm text-[#2B1A07]/80">
              <li>• Até 3 Boards</li>
              <li>• Mensagens ilimitadas</li>
              <li>• Prioridade no suporte</li>
            </ul>
            <Link href="/signup" className="mt-6 inline-block">
              <Button className="w-full">Assinar Pro</Button>
            </Link>
          </div>

          {/* Business */}
          <div className="rounded-2xl border border-[#2B1A07]/15 bg-[#2B1A07]/5 p-6 text-left">
            <h3 className="text-lg font-semibold text-[#2B1A07]"><NoWidows>Business</NoWidows></h3>
            <p className="mt-1 text-sm text-[#2B1A07]/70"><NoWidows>Para times e empresas.</NoWidows></p>
            <p className="mt-6 text-3xl font-bold text-[#2B1A07]">R$299<span className="text-base font-medium text-[#2B1A07]/70">/mês</span></p>
            <ul className="mt-6 space-y-2 text-sm text-[#2B1A07]/80">
              <li>• Boards ilimitados</li>
              <li>• Workspace compartilhado</li>
              <li>• Suporte dedicado</li>
            </ul>
            <Link href="/signup" className="mt-6 inline-block">
              <Button className="w-full">Falar com vendas</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
