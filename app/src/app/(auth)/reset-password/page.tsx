'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const inputCls = cn(
  'flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4',
  'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35',
  'shadow-sm transition-all',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50 focus-visible:border-[#FF6F1E]/60',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

function getStrength(pwd: string) {
  if (!pwd) return 'empty'
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return 'weak'
  if (score <= 3) return 'medium'
  return 'strong'
}

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [tokenExpired, setTokenExpired] = useState(false)

  const strength = getStrength(password)
  const mismatch = confirm.length > 0 && password !== confirm

  // Supabase sends the token in the URL hash — listen for the session.
  // If PASSWORD_RECOVERY doesn't fire within 4 s, the link is invalid or expired.
  useEffect(() => {
    const timeout = setTimeout(() => setTokenExpired(true), 4000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        clearTimeout(timeout)
        setReady(true)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (strength === 'weak') { setError('Escolha uma senha mais forte.'); return }

    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.')
      return
    }
    setDone(true)
    setTimeout(() => { window.location.replace('/board') }, 2500)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FDFBF9] px-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#FF6F1E] opacity-[0.06] blur-3xl translate-y-[-100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 block">
            <span className="font-curia-rounded text-[#2B1A07] text-4xl leading-none">Curia</span>
          </Link>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="font-curia-rounded text-2xl text-[#2B1A07]">Senha atualizada!</h2>
              <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
                Redirecionando para o Board…
              </p>
            </div>
          </div>
        ) : tokenExpired ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-curia-rounded text-2xl text-[#2B1A07]">Link inválido ou expirado</h2>
              <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
                Este link de recuperação não é mais válido. Solicite um novo link.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="font-curia-serif text-sm text-[#FF6F1E] hover:underline"
            >
              Solicitar novo link →
            </Link>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2B1A07]/20 border-t-[#FF6F1E]" />
            <p className="font-curia-serif text-sm text-[#2B1A07]/50">Verificando link…</p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Nova senha</h1>
              <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
                Escolha uma senha forte para sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nova senha */}
              <div>
                <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required minLength={8} disabled={loading}
                    autoComplete="new-password"
                    className={cn(inputCls, 'pr-10')}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B1A07]/40 hover:text-[#2B1A07]/70 transition-colors">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full rounded-full bg-[#2B1A07]/10 overflow-hidden">
                      <div className={cn(
                        'h-full rounded-full transition-all duration-300',
                        strength === 'weak' && 'w-1/3 bg-red-400',
                        strength === 'medium' && 'w-2/3 bg-amber-400',
                        strength === 'strong' && 'w-full bg-emerald-500',
                      )} />
                    </div>
                    <p className={cn('text-xs font-curia-serif',
                      strength === 'weak' && 'text-red-500',
                      strength === 'medium' && 'text-amber-500',
                      strength === 'strong' && 'text-emerald-600',
                    )}>
                      {strength === 'weak' ? 'Fraca' : strength === 'medium' ? 'Média' : 'Forte'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar */}
              <div>
                <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••" required disabled={loading}
                    autoComplete="new-password"
                    className={cn(inputCls, 'pr-10', mismatch && 'border-red-300 focus-visible:ring-red-300/50')}
                  />
                  <button
                    type="button" tabIndex={-1} onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B1A07]/40 hover:text-[#2B1A07]/70 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {mismatch && <p className="mt-1 font-curia-serif text-xs text-red-500">As senhas não coincidem.</p>}
                {confirm.length > 0 && !mismatch && (
                  <p className="mt-1 flex items-center gap-1 font-curia-serif text-xs text-emerald-600">
                    <CheckCircle2 size={12} /> Senhas coincidem
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="font-curia-serif text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading || mismatch}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
                  'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
                  'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {loading
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
                  : <><span>Salvar nova senha</span><ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
