'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useSignIn } from '@clerk/nextjs/legacy'

type Step = 'request' | 'reset' | 'done'

function readError(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'errors' in error) {
    const first = Array.isArray((error as { errors?: unknown[] }).errors)
      ? (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]
      : null
    const message = first?.longMessage || first?.message
    if (message) return message
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { isLoaded, signIn, setActive } = useSignIn()

  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/board')
    }
  }, [isSignedIn, router])

  const passwordMismatch = useMemo(() => {
    return confirmPassword.length > 0 && password !== confirmPassword
  }, [password, confirmPassword])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return

    setError(null)
    setLoading(true)

    try {
      const created = await signIn.create({ identifier: email.trim() })
      const factor = created.supportedFirstFactors?.find((item) => item.strategy === 'reset_password_email_code')

      if (!factor || !('emailAddressId' in factor)) {
        throw new Error('Esta conta não possui recuperação por senha via e-mail.')
      }

      await signIn.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: factor.emailAddressId,
      })

      setEmailAddressId(factor.emailAddressId)
      setStep('reset')
    } catch (err: unknown) {
      setError(readError(err, 'Não foi possível iniciar a recuperação de senha.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !emailAddressId) return
    if (passwordMismatch) {
      setError('As senhas não coincidem.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      })

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error('Não foi possível concluir a redefinição da senha.')
      }

      await setActive({ session: result.createdSessionId })
      setStep('done')
      setTimeout(() => {
        window.location.replace('/board')
      }, 1200)
    } catch (err: unknown) {
      setError(readError(err, 'Não foi possível redefinir sua senha.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-[#2B1A07]/10 bg-white p-8 shadow-[0_24px_80px_rgba(43,26,7,0.08)]">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-5 inline-block">
            <span className="font-curia-rounded text-4xl leading-none text-[#2B1A07]">Curia</span>
          </Link>
          <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">
            {step === 'request' && 'Recuperar senha'}
            {step === 'reset' && 'Defina sua nova senha'}
            {step === 'done' && 'Senha atualizada'}
          </h1>
          <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
            {step === 'request' && 'Digite o e-mail da sua conta para receber o código de recuperação.'}
            {step === 'reset' && `Enviamos um código para ${email}.`}
            {step === 'done' && 'Login concluído. Redirecionando para o Board.'}
          </p>
        </div>

        {step === 'request' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="voce@empresa.com"
                required
                disabled={loading}
                autoComplete="email"
                className="flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4 font-curia-serif text-sm text-[#2B1A07] shadow-sm outline-none transition-all placeholder:text-[#2B1A07]/35 focus-visible:border-[#FF6F1E]/60 focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50"
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
              className="flex w-full items-center justify-center rounded-xl bg-[#FF6F1E] px-5 py-3 font-curia-serif text-sm font-semibold text-[#2B1A07] shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">Código de verificação</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setError(null)
                }}
                placeholder="123456"
                required
                disabled={loading}
                className="flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4 font-curia-serif text-sm text-[#2B1A07] shadow-sm outline-none transition-all placeholder:text-[#2B1A07]/35 focus-visible:border-[#FF6F1E]/60 focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
                autoComplete="new-password"
                className="flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4 font-curia-serif text-sm text-[#2B1A07] shadow-sm outline-none transition-all placeholder:text-[#2B1A07]/35 focus-visible:border-[#FF6F1E]/60 focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError(null)
                }}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
                autoComplete="new-password"
                className="flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4 font-curia-serif text-sm text-[#2B1A07] shadow-sm outline-none transition-all placeholder:text-[#2B1A07]/35 focus-visible:border-[#FF6F1E]/60 focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="font-curia-serif text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="flex w-full items-center justify-center rounded-xl bg-[#FF6F1E] px-5 py-3 font-curia-serif text-sm font-semibold text-[#2B1A07] shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="font-curia-serif text-sm text-emerald-700">Sua senha foi redefinida com sucesso.</p>
          </div>
        )}

        <p className="mt-6 text-center">
          <Link href="/login" className="font-curia-serif text-xs text-[#2B1A07]/35 transition-colors hover:text-[#2B1A07]/60">
            ← Continuar
          </Link>
        </p>
      </div>
    </div>
  )
}
