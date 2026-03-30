'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLogin = mode === 'login'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/board')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/board` },
        })
        if (error) throw error
        router.push('/board')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/board` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FDFBF9] px-4 overflow-hidden">
      {/* Glow decorativo — igual ao Hero da LP */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#FF6F1E] opacity-[0.06] blur-3xl translate-y-[-100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo Curia */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 block">
            <span className="font-curia-rounded text-[#2B1A07] text-4xl leading-none">Curia</span>
          </Link>

          <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">
            {isLogin ? 'Bem-vindo de volta' : 'Monte seu Board'}
          </h1>
          <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
            {isLogin
              ? 'Acesse seu Board estratégico'
              : 'Crie sua conta e comece a decidir melhor'}
          </p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className={cn(
            'flex w-full items-center justify-center gap-3 rounded-xl border border-[#2B1A07]/15 bg-white px-4 py-3',
            'font-curia-serif text-sm font-medium text-[#2B1A07] shadow-sm',
            'transition-all hover:border-[#2B1A07]/25 hover:shadow-md',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {googleLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Continuar com Google
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-[#2B1A07]/10" />
          <span className="font-curia-serif text-xs text-[#2B1A07]/40">ou</span>
          <div className="flex-1 border-t border-[#2B1A07]/10" />
        </div>

        {/* Email/Password form */}
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
              className={cn(
                'flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4',
                'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35',
                'shadow-sm transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50 focus-visible:border-[#FF6F1E]/60',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
          </div>

          <div>
            <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className={cn(
                'flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4',
                'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35',
                'shadow-sm transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50 focus-visible:border-[#FF6F1E]/60',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="font-curia-serif text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
              'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
              'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
            ) : (
              <>
                {isLogin ? 'Entrar no Board' : 'Criar conta'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <p className="mt-6 text-center font-curia-serif text-sm text-[#2B1A07]/50">
          {isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <Link
            href={isLogin ? '/signup' : '/login'}
            className="font-medium text-[#FF6F1E] hover:underline"
          >
            {isLogin ? 'Criar conta' : 'Entrar'}
          </Link>
        </p>

        {/* Back to home */}
        <p className="mt-3 text-center">
          <Link
            href="/"
            className="font-curia-serif text-xs text-[#2B1A07]/35 transition-colors hover:text-[#2B1A07]/60"
          >
            ← Voltar para o início
          </Link>
        </p>
      </div>
    </div>
  )
}
