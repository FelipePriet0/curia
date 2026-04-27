import { ArrowRight } from 'lucide-react'

import { ChamberSvg } from '@/components/brand/chamber/ChamberSvg'

const gradientTextClass =
  'text-transparent bg-[linear-gradient(180deg,_rgba(26,26,26,0.58)_0%,_rgba(26,26,26,0.34)_100%)] bg-clip-text'

type BoardMockupProps = {
  className?: string
}

export function BoardMockup({ className = '' }: BoardMockupProps) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[#0B0B0F]/15 shadow-2xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-[#0B0B0F]/10 bg-[#F5EDE0]/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="mx-auto text-xs text-[#0B0B0F]/50">Curia — Board Room</span>
      </div>

      <div className="flex flex-col items-center px-6 pb-5 pt-7" style={{ minHeight: 360 }}>
        <div className="mb-5 text-center">
          <h3 className={`text-xl font-[var(--font-curia-tech)] font-black tracking-[-0.04em] leading-none md:text-2xl ${gradientTextClass}`}>
            Olá, Empresário
          </h3>
          <p className={`mt-1 text-sm font-[var(--font-curia-tech)] font-black tracking-[-0.03em] leading-tight md:text-base ${gradientTextClass}`}>
            O que você deseja resolver hoje?
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center py-2">
          <ChamberSvg />
        </div>

        <div className="mt-4 w-full">
          <div className="flex items-center gap-2 rounded-xl border border-[#0B0B0F]/15 bg-white px-4 py-3 shadow-sm">
            <span className="flex-1 text-sm text-[#0B0B0F]/30">
              Apresente seu desafio ao Board...
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0B0B0F]/08">
              <ArrowRight className="h-3.5 w-3.5 text-[#0B0B0F]/35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
