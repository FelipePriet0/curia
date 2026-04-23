"use client"

import { useEffect, useState } from 'react'

type Consent = {
  essential: true
  analytics: boolean
  marketing: boolean
  functional: boolean
  updatedAt: string
}

const COOKIE_NAME = 'curia_cookie_consent'
const COOKIE_MAX_AGE_DAYS = 180

function readConsent(): Consent | null {
  if (typeof document === 'undefined') return null
  const raw = document.cookie.split('; ').find((c) => c.startsWith(COOKIE_NAME + '='))
  if (!raw) return null
  try {
    const val = decodeURIComponent(raw.split('=')[1])
    const parsed = JSON.parse(val) as Consent
    if (typeof parsed.essential !== 'boolean') return null
    return { ...parsed, essential: true }
  } catch {
    return null
  }
}

function writeConsent(consent: Consent) {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  const value = encodeURIComponent(JSON.stringify(consent))
  document.cookie = `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export default function CookiesPage() {
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [functional, setFunctional] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const current = readConsent()
    if (current) {
      setAnalytics(!!current.analytics)
      setMarketing(!!current.marketing)
      setFunctional(!!current.functional)
    }
  }, [])

  function savePreferences() {
    const consent: Consent = {
      essential: true,
      analytics,
      marketing,
      functional,
      updatedAt: new Date().toISOString(),
    }
    writeConsent(consent)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function acceptAll() {
    setAnalytics(true)
    setMarketing(true)
    setFunctional(true)
    const consent: Consent = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
      updatedAt: new Date().toISOString(),
    }
    writeConsent(consent)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function rejectAll() {
    setAnalytics(false)
    setMarketing(false)
    setFunctional(false)
    const consent: Consent = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
      updatedAt: new Date().toISOString(),
    }
    writeConsent(consent)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-curia-rounded text-2xl text-[#0B0B0F]">Preferências de cookies</h1>
      <p className="mt-3 font-curia-serif text-sm text-[#0B0B0F]/70">
        Usamos cookies essenciais para o funcionamento do site e, com seu consentimento, cookies adicionais para
        entender o uso e melhorar sua experiência. Você pode ajustar suas preferências a qualquer momento.
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-curia-serif text-sm font-medium text-[#0B0B0F]">Essenciais</p>
              <p className="text-xs text-[#0B0B0F]/60 mt-1">Necessários para autenticação, segurança e recursos básicos. Sempre ativos.</p>
            </div>
            <label className="text-xs text-[#0B0B0F]/50 select-none">Ativo</label>
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-curia-serif text-sm font-medium text-[#0B0B0F]">Funcionais</p>
              <p className="text-xs text-[#0B0B0F]/60 mt-1">Lembram preferências e melhoram recursos.</p>
            </div>
            <input type="checkbox" className="h-4 w-4" checked={functional} onChange={(e) => setFunctional(e.target.checked)} />
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-curia-serif text-sm font-medium text-[#0B0B0F]">Analytics</p>
              <p className="text-xs text-[#0B0B0F]/60 mt-1">Medição de uso, diagnóstico e performance.</p>
            </div>
            <input type="checkbox" className="h-4 w-4" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-curia-serif text-sm font-medium text-[#0B0B0F]">Marketing</p>
              <p className="text-xs text-[#0B0B0F]/60 mt-1">Personalização e mensagens orientadas.</p>
            </div>
            <input type="checkbox" className="h-4 w-4" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={savePreferences} className="rounded-xl bg-[#0B0B0F] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 font-curia-serif">Salvar preferências</button>
        <button onClick={acceptAll} className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[#0B0B0F]/80 hover:bg-[#0B0B0F]/[0.05] font-curia-serif">Aceitar todos</button>
        <button onClick={rejectAll} className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[#0B0B0F]/80 hover:bg-[#0B0B0F]/[0.05] font-curia-serif">Rejeitar não essenciais</button>
      </div>

      {saved && (
        <p className="mt-3 text-xs text-green-700 font-curia-serif">Preferências atualizadas.</p>
      )}

      <p className="mt-8 text-xs text-[#0B0B0F]/50 font-curia-serif">
        Ao continuar usando a Curia, você confirma que compreende que estratégias e recomendações exibidas
        são sugestões e que quaisquer decisões de implementação são de sua exclusiva responsabilidade. Consulte
        os <a href="/terms" className="underline">Termos de Uso</a> para mais detalhes.
      </p>
    </div>
  )
}

