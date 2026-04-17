'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSignIn, useSignUp } from '@clerk/nextjs/legacy'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { ArrowRight, Eye, EyeOff, CheckCircle2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

function ptError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('user already registered')) return 'Este e-mail já está cadastrado. Faça login.'
  if (m.includes('password should be at least')) return 'A senha deve ter pelo menos 8 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid format')) return 'Formato de e-mail inválido.'
  if (m.includes('rate limit') || m.includes('too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.'
  if (m.includes('network') || m.includes('fetch')) return 'Erro de conexão. Verifique sua internet.'
  if (m.includes('weak password')) return 'Senha muito fraca. Use letras, números e símbolos.'
  return msg
}

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

const inputCls = cn(
  'flex h-11 w-full rounded-xl border border-[#2B1A07]/15 bg-white px-4',
  'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35',
  'shadow-sm transition-all',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F1E]/50 focus-visible:border-[#FF6F1E]/60',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

function PasswordField({ label, value, onChange, placeholder, disabled, showStrength, autoComplete }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled: boolean
  showStrength?: boolean
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const strength = getStrength(value)

  return (
    <div>
      {label && <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          required
          minLength={8}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(inputCls, 'pr-10')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B1A07]/40 transition-colors hover:text-[#2B1A07]/70"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#2B1A07]/10">
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

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="font-curia-serif text-sm text-red-700">{msg}</p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C17 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.3-.2-1.9H12Z" />
      <path fill="#34A853" d="M2 12c0 2 .8 3.8 2.1 5.2l3.4-2.6C6.9 13.9 6.6 13 6.6 12s.3-1.9.9-2.6L4.1 6.8A9.9 9.9 0 0 0 2 12Z" />
      <path fill="#FBBC05" d="M12 22c2.7 0 5-1 6.7-2.7l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1l-3.5 2.7C4.5 19.8 8 22 12 22Z" />
      <path fill="#4285F4" d="M21.6 10.1H12v4h5.5c-.3 1.4-1.3 2.6-2.8 3.5l3.3 2.6c1.9-1.8 3.6-4.5 3.6-8.2 0-.7-.1-1.3-.2-1.9Z" />
    </svg>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#2B1A07]/10" />
      <span className="font-curia-serif text-xs uppercase tracking-[0.15em] text-[#2B1A07]/35">ou</span>
      <div className="h-px flex-1 bg-[#2B1A07]/10" />
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FDFBF9] px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[500px] w-[500px] -translate-y-[100px] rounded-full bg-[#FF6F1E] opacity-[0.06] blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  )
}

function Logo() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <Link href="/" className="mb-5 block">
        <span className="font-curia-rounded text-4xl leading-none text-[#2B1A07]">Curia</span>
      </Link>
    </div>
  )
}

function ConfirmEmailScreen({ email }: { email: string }) {
  return (
    <Shell>
      <Logo />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6F1E]/10">
          <Mail size={28} className="text-[#FF6F1E]" />
        </div>
        <div>
          <h2 className="font-curia-rounded text-2xl text-[#2B1A07]">Conta criada</h2>
          <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
            A conta <span className="font-medium text-[#2B1A07]">{email}</span> já está pronta para uso.
          </p>
        </div>
        <Link href="/login" className="font-curia-serif text-xs text-[#2B1A07]/40 transition-colors hover:text-[#2B1A07]/60">
          ← Voltar para o login
        </Link>
      </div>
    </Shell>
  )
}

function readClerkError(error: unknown, fallback: string) {
  if (isClerkAPIResponseError(error)) {
    const first = error.errors[0]
    if (!first) return fallback

    const code = first.code?.toLowerCase() ?? ''
    const message = first.longMessage || first.message || fallback

    if (code.includes('identifier') || code.includes('form_identifier')) return 'Formato de e-mail inválido.'
    if (code.includes('password')) return ptError(message)
    if (code.includes('already_exists')) return 'Este e-mail já está cadastrado. Faça login.'
    if (code.includes('not_found') || code.includes('password_incorrect') || code.includes('strategy')) return 'E-mail ou senha incorretos.'
    if (code.includes('too_many') || code.includes('rate_limit')) return 'Muitas tentativas. Aguarde alguns minutos.'

    return ptError(message)
  }

  if (error instanceof Error) return ptError(error.message)
  return fallback
}

export function LoginForm() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleLogin() {
    if (!isLoaded) return
    setError(null)
    setLoading(true)

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/board',
        oidcPrompt: 'select_account',
      })
    } catch (err: unknown) {
      setError(readClerkError(err, 'Não foi possível iniciar o login com Google.'))
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setError(null)
    setLoading(true)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error('Não foi possível concluir o login.')
      }

      await setActive({ session: result.createdSessionId })
      window.location.replace('/board')
    } catch (err: unknown) {
      setError(readClerkError(err, 'Não foi possível fazer login.'))
      setLoading(false)
    }
  }

  return (
    <Shell>
      <Logo />
      <div className="mb-8 text-center">
        <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Bem-vindo de volta</h1>
        <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">Acesse seu Board estratégico</p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={loading}
          className={cn(
            'flex w-full items-center justify-center gap-3 rounded-xl border border-[#2B1A07]/15 bg-white px-5 py-3',
            'font-curia-serif text-sm font-semibold text-[#2B1A07] shadow-sm transition-all hover:bg-[#F8F3EE]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <GoogleIcon />
          <span>Continuar com Google</span>
        </button>

        <Divider />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <PasswordField
            label=""
            value={password}
            onChange={(value) => {
              setPassword(value)
              setError(null)
            }}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        {error && <ErrorBox msg={error} />}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
            'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
            'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
          ) : (
            <>
              <span>Entrar no Board</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center font-curia-serif text-sm text-[#2B1A07]/50">
        Ainda não tem conta? <Link href="/signup" className="font-medium text-[#FF6F1E] hover:underline">Criar conta</Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/" className="font-curia-serif text-xs text-[#2B1A07]/35 transition-colors hover:text-[#2B1A07]/60">
          ← Voltar para o início
        </Link>
      </p>
    </Shell>
  )
}

export function SignupForm() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreated, setShowCreated] = useState(false)
  const [awaitingVerification, setAwaitingVerification] = useState(false)

  const strength = getStrength(password)
  const passwordMismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (strength === 'weak') {
      setError('Escolha uma senha mais forte.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        setShowCreated(true)
        window.location.replace('/onboarding')
        return
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setAwaitingVerification(true)
      setLoading(false)
    } catch (err: unknown) {
      setError(readClerkError(err, 'Não foi possível criar a conta.'))
      setLoading(false)
    }
  }

  async function handleVerification(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return

    setError(null)
    setLoading(true)

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error('Não foi possível confirmar o e-mail.')
      }

      await setActive({ session: result.createdSessionId })
      setShowCreated(true)
      window.location.replace('/onboarding')
    } catch (err: unknown) {
      setError(readClerkError(err, 'Não foi possível confirmar o e-mail.'))
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    if (!isLoaded) return

    setError(null)
    setLoading(true)

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
        oidcPrompt: 'select_account',
      })
    } catch (err: unknown) {
      setError(readClerkError(err, 'Não foi possível iniciar o cadastro com Google.'))
      setLoading(false)
    }
  }

  if (showCreated) {
    return <ConfirmEmailScreen email={email} />
  }

  if (awaitingVerification) {
    return (
      <Shell>
        <Logo />
        <div className="mb-8 text-center">
          <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Confirme seu e-mail</h1>
          <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">
            Enviamos um código para <span className="font-medium text-[#2B1A07]">{email}</span>.
          </p>
        </div>

        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <label htmlFor="signup-code" className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">
              Código de verificação
            </label>
            <input
              id="signup-code"
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
              className={inputCls}
            />
          </div>

          {error && <ErrorBox msg={error} />}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
              'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
              'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
            ) : (
              <>
                <span>Confirmar e entrar</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-curia-serif text-sm text-[#2B1A07]/50">
          Código não chegou? Verifique spam ou reinicie o cadastro.
        </p>
        <p className="mt-3 text-center">
          <Link href="/signup" className="font-curia-serif text-xs text-[#2B1A07]/35 transition-colors hover:text-[#2B1A07]/60">
            ← Voltar
          </Link>
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <Logo />
      <div className="mb-8 text-center">
        <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Monte seu Board</h1>
        <p className="mt-2 font-curia-serif text-sm text-[#2B1A07]/60">Crie sua conta e comece a decidir melhor</p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => void handleGoogleSignup()}
          disabled={loading}
          className={cn(
            'flex w-full items-center justify-center gap-3 rounded-xl border border-[#2B1A07]/15 bg-white px-5 py-3',
            'font-curia-serif text-sm font-semibold text-[#2B1A07] shadow-sm transition-all hover:bg-[#F8F3EE]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <GoogleIcon />
          <span>Continuar com Google</span>
        </button>

        <Divider />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">E-mail</label>
          <input
            id="signup-email"
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
            className={inputCls}
          />
        </div>

        <PasswordField
          label="Senha"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setError(null)
          }}
          autoComplete="new-password"
          disabled={loading}
          showStrength
        />

        <div>
          <label className="mb-1.5 block font-curia-serif text-sm font-medium text-[#2B1A07]">Confirmar senha</label>
          <PasswordField
            label=""
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={loading}
          />
          {passwordMismatch && <p className="mt-1 font-curia-serif text-xs text-red-500">As senhas não coincidem.</p>}
          {confirm.length > 0 && !passwordMismatch && (
            <p className="mt-1 flex items-center gap-1 font-curia-serif text-xs text-emerald-600">
              <CheckCircle2 size={12} /> Senhas coincidem
            </p>
          )}
        </div>

        <div id="clerk-captcha" data-cl-theme="light" data-cl-size="flexible" />

        {error && <ErrorBox msg={error} />}

        <button
          type="submit"
          disabled={loading || passwordMismatch}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
            'bg-[#FF6F1E] font-curia-serif text-sm font-semibold text-[#2B1A07]',
            'shadow-sm transition-all hover:opacity-90 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B1A07]/30 border-t-[#2B1A07]" />
          ) : (
            <>
              <span>Criar conta</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center font-curia-serif text-sm text-[#2B1A07]/50">
        Já tem conta? <Link href="/login" className="font-medium text-[#FF6F1E] hover:underline">Entrar</Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/" className="font-curia-serif text-xs text-[#2B1A07]/35 transition-colors hover:text-[#2B1A07]/60">
          ← Voltar para o início
        </Link>
      </p>
    </Shell>
  )
}
