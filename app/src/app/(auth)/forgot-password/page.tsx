'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS = 3
const BLOCK_DURATION_MS = 60 * 60 * 1000 // 1 hora
const LS_KEY = 'forgot_pw_attempts'

interface AttemptsRecord {
  count: number
  firstAt: number
}

function getAttemptsRecord(): AttemptsRecord {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { count: 0, firstAt: 0 }
    return JSON.parse(raw) as AttemptsRecord
  } catch {
    return { count: 0, firstAt: 0 }
  }
}

function saveAttemptsRecord(record: AttemptsRecord) {
  localStorage.setItem(LS_KEY, JSON.stringify(record))
}

function clearAttemptsRecord() {
  localStorage.removeItem(LS_KEY)
}

const inputCls = cn(
  'flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4',
  'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35',
  'shadow-sm transition-all',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50 focus-visible:border-[#FF6F1E]/60',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [blocked, setBlocked] = useState(false)

  // Restaura estado do localStorage ao montar
  useEffect(() => {
    const record = getAttemptsRecord()
    const elapsed = Date.now() - record.firstAt
    if (record.count >= MAX_ATTEMPTS && elapsed < BLOCK_DURATION_MS) {
      setAttempts(record.count)
      setBlocked(true)
    } else if (elapsed >= BLOCK_DURATION_MS) {
      clearAttemptsRecord()
    } else {
      setAttempts(record.count)
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function sendEmail() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      return
    }

    const record = getAttemptsRecord()
    const newCount = record.count + 1
    const firstAt = record.count === 0 ? Date.now() : record.firstAt
    saveAttemptsRecord({ count: newCount, firstAt })
    setAttempts(newCount)

    if (newCount >= MAX_ATTEMPTS) {
      setBlocked(true)
    }

    setSent(true)
    setCooldown(COOLDOWN_SECONDS)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendEmail()
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

        {blocked && !sent ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Mail size={28} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-curia-rounded text-2xl text-[#2B1A07]">Limite atingido</h2>
              <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
                Você já utilizou as {MAX_ATTEMPTS} tentativas disponíveis.
                Tente novamente em 1 hora.
              </p>
            </div>
            <Link
              href="/login"
              className="font-curia-serif text-xs text-[#2B1A07]/40 hover:text-[#2B1A07]/60 transition-colors"
            >
              ← Voltar para o login
            </Link>
          </div>
        ) : sent ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6F1E]/10">
              <Mail size={28} className="text-[#FF6F1E]" />
            </div>
            <div>
              <h2 className="font-curia-rounded text-2xl text-[#2B1A07]">E-mail enviado</h2>
              <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
                Enviamos as instruções para <span className="font-medium text-[#2B1A07]">{email}</span>.
                Verifique sua caixa de entrada e pasta de spam.
              </p>
            </div>

            {error && (
              <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="font-curia-serif text-sm text-red-700">{error}</p>
              </div>
            )}

            {blocked ? (
              <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="font-curia-serif text-sm text-amber-700">
                  Você já utilizou as 3 tentativas disponíveis. Tente novamente em 1 hora.
                </p>
              </div>
            ) : (
              <button
                onClick={sendEmail}
                disabled={cooldown > 0 || loading}
                className={cn(
                  'font-curia-serif text-sm transition-colors',
                  cooldown > 0 || loading
                    ? 'text-[#2B1A07]/30 cursor-not-allowed'
                    : 'text-[#FF6F1E] hover:underline'
                )}
              >
                {loading
                  ? 'Enviando...'
                  : cooldown > 0
                    ? `Reenviar link em ${cooldown}s (${attempts}/${MAX_ATTEMPTS} tentativas)`
                    : `Reenviar link (${attempts}/${MAX_ATTEMPTS} tentativas)`
                }
              </button>
            )}

            <Link
              href="/login"
              className="font-curia-serif text-xs text-[#2B1A07]/40 hover:text-[#2B1A07]/60 transition-colors"
            >
              ← Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Recuperar senha</h1>
              <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
                Informe seu e-mail e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  required
                  disabled={loading}
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="font-curia-serif text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
                  'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
                  'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {loading
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
                  : <><span>Enviar link de recuperação</span><ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </form>

            <p className="mt-6 text-center">
              <Link href="/login" className="font-curia-serif text-xs text-[#2B1A07]/40 hover:text-[#2B1A07]/60 transition-colors">
                ← Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
