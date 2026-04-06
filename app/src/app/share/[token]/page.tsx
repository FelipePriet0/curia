import type { Metadata } from 'next'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  void params
  return { title: `Curia — Conversa Compartilhada` }
}

async function getShared(token: string) {
  try {
    const h = await headers()
    const proto = h.get('x-forwarded-proto') ?? 'http'
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const originEnv = process.env.NEXT_PUBLIC_BASE_URL
    const origin = originEnv && originEnv.length > 0 ? originEnv : `${proto}://${host}`
    const res = await fetch(`${origin}/api/share/${token}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getShared(token)
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Link inválido</h1>
        <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">Esta conversa não está mais disponível.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <span className="font-curia-rounded text-[#2B1A07] text-3xl leading-none">Curia</span>
        <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/50">Conversa compartilhada — somente leitura</p>
        <p className="mt-2 font-curia-serif text-[11px] text-[#2B1A07]/45">
          Revise criticamente antes de implementar. Este conteúdo não substitui assessoria profissional.
        </p>
        <h1 className="mt-4 font-curia-rounded text-xl text-[#2B1A07]">{data.title}</h1>
      </div>
      <div className="space-y-4">
        {data.messages.map((m: any, i: number) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={
              'inline-block max-w-[85%] rounded-xl px-4 py-3 font-curia-serif text-sm leading-relaxed ' +
              (m.role === 'user' ? 'bg-[#FF6F1E] text-[#2B1A07] rounded-br-sm' : 'bg-[#2B1A07]/[0.06] text-[#2B1A07] rounded-bl-sm')
            }>
              <pre className="whitespace-pre-wrap break-words">{m.content}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
