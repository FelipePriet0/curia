'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, CheckCircle2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

// ─── Error map PT ─────────────────────────────────────────────────────────────
function ptError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed'))
    return 'E-mail não confirmado. Verifique sua caixa de entrada.'
  if (m.includes('user already registered'))
    return 'Este e-mail já está cadastrado. Faça login.'
  if (m.includes('password should be at least'))
    return 'A senha deve ter pelo menos 8 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid format'))
    return 'Formato de e-mail inválido.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Muitas tentativas. Aguarde alguns minutos.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet.'
  if (m.includes('weak password'))
    return 'Senha muito fraca. Use letras, números e símbolos.'
  return msg
}

// ─── Password strength ────────────────────────────────────────────────────────
type Strength = 'empty' | 'weak' | 'medium' | 'strong'

function getStrength(pwd: string): Strength {
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

const STRENGTH_LABEL: Record<Strength, string> = {
  empty: '',
  weak: 'Fraca',
  medium: 'Média',
  strong: 'Forte',
}
const STRENGTH_COLOR: Record<Strength, string> = {
  empty: 'bg-[#2B1A07]/10',
  weak: 'bg-red-400',
  medium: 'bg-amber-400',
  strong: 'bg-emerald-500',
}
const STRENGTH_WIDTH: Record<Strength, string> = {
  empty: 'w-0',
  weak: 'w-1/3',
  medium: 'w-2/3',
  strong: 'w-full',
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputCls = cn(
  'flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4',
  'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35',
  'shadow-sm transition-all',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50 focus-visible:border-[#FF6F1E]/60',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

// ─── Google button ────────────────────────────────────────────────────────────
function GoogleButton({ onClick, disabled, loading, label }: {
  onClick: () => void; disabled: boolean; loading: boolean; label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-center gap-3 rounded-xl border border-[#2B1A07]/15 bg-white px-4 py-3',
        'font-curia-serif text-sm font-medium text-[#2B1A07] shadow-sm',
        'transition-all hover:border-[#2B1A07]/25 hover:shadow-md',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
      ) : (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {label}
    </button>
  )
}

// ─── Password field ───────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, placeholder, disabled, showStrength }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; disabled: boolean; showStrength?: boolean
}) {
  const [show, setShow] = useState(false)
  const strength = getStrength(value)

  return (
    <div>
      <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          required
          minLength={8}
          disabled={disabled}
          className={cn(inputCls, 'pr-10')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B1A07]/40 hover:text-[#2B1A07]/70 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full rounded-full bg-[#2B1A07]/10 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-300', STRENGTH_COLOR[strength], STRENGTH_WIDTH[strength])} />
          </div>
          <p className={cn(
            'text-xs font-curia-serif',
            strength === 'weak' && 'text-red-500',
            strength === 'medium' && 'text-amber-500',
            strength === 'strong' && 'text-emerald-600',
          )}>
            {STRENGTH_LABEL[strength]}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="flex-1 border-t border-[#2B1A07]/10" />
      <span className="font-curia-serif text-xs text-[#2B1A07]/40">ou</span>
      <div className="flex-1 border-t border-[#2B1A07]/10" />
    </div>
  )
}

// ─── Error box ────────────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="font-curia-serif text-sm text-red-700">{msg}</p>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FDFBF9] px-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#FF6F1E] opacity-[0.06] blur-3xl translate-y-[-100px]" />
      </div>
      <div className="relative w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <Link href="/" className="mb-5 block">
        <span className="font-curia-rounded text-[#2B1A07] text-4xl leading-none">Curia</span>
      </Link>
    </div>
  )
}

// ─── Confirm Email Screen ─────────────────────────────────────────────────────
function ConfirmEmailScreen({ email, onResend }: { email: string; onResend: () => Promise<void> }) {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    setResending(true)
    setError(null)
    try {
      await onResend()
      setResent(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? ptError(e.message) : 'Erro ao reenviar.')
    } finally {
      setResending(false)
    }
  }

  return (
    <Shell>
      <Logo />
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6F1E]/10">
          <Mail size={28} className="text-[#FF6F1E]" />
        </div>
        <div>
          <h2 className="font-curia-rounded text-2xl text-[#2B1A07]">Confirme seu e-mail</h2>
          <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
            Enviamos um link para <span className="font-medium text-[#2B1A07]">{email}</span>.
            Clique no link para ativar sua conta.
          </p>
        </div>

        <div className="w-full rounded-xl border border-[#2B1A07]/10 bg-[#2B1A07]/[0.03] px-4 py-3 text-left space-y-1">
          <p className="font-curia-serif text-xs text-[#2B1A07]/50">Não recebeu?</p>
          <ul className="font-curia-serif text-xs text-[#2B1A07]/60 list-disc list-inside space-y-0.5">
            <li>Verifique a pasta de spam</li>
            <li>Aguarde até 2 minutos</li>
          </ul>
        </div>

        {error && <ErrorBox msg={error} />}

        {resent ? (
          <div className="flex items-center gap-2 text-emerald-600 font-curia-serif text-sm">
            <CheckCircle2 size={16} /> E-mail reenviado!
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-curia-serif text-sm text-[#FF6F1E] hover:underline disabled:opacity-50"
          >
            {resending ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
          </button>
        )}

        <Link href="/login" className="font-curia-serif text-xs text-[#2B1A07]/40 hover:text-[#2B1A07]/60 transition-colors">
          ← Voltar para o login
        </Link>
      </div>
    </Shell>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────
export function LoginForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.replace('/board')
    } catch (err: unknown) {
      setError(ptError(err instanceof Error ? err.message : 'Erro desconhecido'))
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/board` },
    })
    if (error) {
      setError(ptError(error.message))
      setGoogleLoading(false)
    }
  }

  return (
    <Shell>
      <Logo />
      <div className="mb-8 text-center">
        <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Bem-vindo de volta</h1>
        <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">Acesse seu Board estratégico</p>
      </div>

      <GoogleButton onClick={handleGoogle} disabled={loading || googleLoading} loading={googleLoading} label="Continuar com Google" />
      <Divider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">E-mail</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com" required disabled={loading || googleLoading}
            className={inputCls}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-curia-serif text-sm font-medium text-[#2B1A07]">Senha</label>
            <Link href="/forgot-password" className="font-curia-serif text-xs text-[#FF6F1E] hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <PasswordField label="" value={password} onChange={setPassword} disabled={loading || googleLoading} />
        </div>

        {error && <ErrorBox msg={error} />}

        <button
          type="submit" disabled={loading || googleLoading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
            'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
            'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {loading
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
            : <><span>Entrar no Board</span><ArrowRight className="h-4 w-4" /></>
          }
        </button>
      </form>

      <p className="mt-6 text-center font-curia-serif text-sm text-[#2B1A07]/50">
        Ainda não tem conta?{' '}
        <Link href="/signup" className="font-medium text-[#FF6F1E] hover:underline">Criar conta</Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/" className="font-curia-serif text-xs text-[#2B1A07]/35 hover:text-[#2B1A07]/60 transition-colors">
          ← Voltar para o início
        </Link>
      </p>
    </Shell>
  )
}

// ─── Signup Form ──────────────────────────────────────────────────────────────
export function SignupForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getStrength(password)
  const passwordMismatch = confirm.length > 0 && password !== confirm

  const handleResend = useCallback(async () => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
  }, [supabase, email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (strength === 'weak') { setError('Escolha uma senha mais forte.'); return }
    if (!terms) { setError('Aceite os Termos de Uso para continuar.'); return }

    setError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/board` },
      })
      if (error) throw error

      // E-mail já cadastrado: identities vazio = conta existe mas confirmação pendente
      if (data.user && data.user.identities?.length === 0) {
        setError('Este e-mail já está cadastrado. Faça login ou recupere sua senha.')
        setLoading(false)
        return
      }

      // Session imediata (email confirmation desabilitado no Supabase)
      if (data.session) {
        window.location.replace('/board')
        return
      }

      // Precisa confirmar e-mail
      setShowConfirm(true)
    } catch (err: unknown) {
      setError(ptError(err instanceof Error ? err.message : 'Erro desconhecido'))
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/board` },
    })
    if (error) {
      setError(ptError(error.message))
      setGoogleLoading(false)
    }
  }

  if (showConfirm) {
    return <ConfirmEmailScreen email={email} onResend={handleResend} />
  }

  return (
    <Shell>
      <Logo />
      <div className="mb-8 text-center">
        <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Monte seu Board</h1>
        <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">Crie sua conta e comece a decidir melhor</p>
      </div>

      <GoogleButton onClick={handleGoogle} disabled={loading || googleLoading} loading={googleLoading} label="Cadastrar com Google" />
      <Divider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">E-mail</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com" required disabled={loading || googleLoading}
            className={inputCls}
          />
        </div>

        <PasswordField
          label="Senha"
          value={password}
          onChange={setPassword}
          disabled={loading || googleLoading}
          showStrength
        />

        <div>
          <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">Confirmar senha</label>
          <div className="relative">
            <PasswordField
              label=""
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              disabled={loading || googleLoading}
            />
            {passwordMismatch && (
              <p className="mt-1 font-curia-serif text-xs text-red-500">As senhas não coincidem.</p>
            )}
            {confirm.length > 0 && !passwordMismatch && (
              <p className="mt-1 flex items-center gap-1 font-curia-serif text-xs text-emerald-600">
                <CheckCircle2 size={12} /> Senhas coincidem
              </p>
            )}
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#2B1A07]/20 accent-[#FF6F1E]"
          />
          <span className="font-curia-serif text-xs text-[#2B1A07]/60 leading-relaxed">
            Concordo com os{' '}
            <a href="#" className="text-[#FF6F1E] hover:underline">Termos de Uso</a>
            {' '}e a{' '}
            <a href="#" className="text-[#FF6F1E] hover:underline">Política de Privacidade</a>.
          </span>
        </label>

        {error && <ErrorBox msg={error} />}

        <button
          type="submit"
          disabled={loading || googleLoading || passwordMismatch}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
            'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
            'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {loading
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
            : <><span>Criar conta</span><ArrowRight className="h-4 w-4" /></>
          }
        </button>
      </form>

      <p className="mt-6 text-center font-curia-serif text-sm text-[#2B1A07]/50">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-[#FF6F1E] hover:underline">Entrar</Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/" className="font-curia-serif text-xs text-[#2B1A07]/35 hover:text-[#2B1A07]/60 transition-colors">
          ← Voltar para o início
        </Link>
      </p>
    </Shell>
  )
}

// ─── Legacy export (backwards compat) ────────────────────────────────────────
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  return mode === 'login' ? <LoginForm /> : <SignupForm />
}
