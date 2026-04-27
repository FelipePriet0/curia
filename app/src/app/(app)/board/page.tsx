'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef, useReducer } from 'react'
import { useClerk } from '@clerk/nextjs'
import { PanelLeftClose, PanelLeftOpen, GitFork, Compass, ShieldAlert, ClipboardCheck } from 'lucide-react'
import { ConversationList } from '@/components/board/ConversationList'
import { ReviewBanner } from '@/components/board/ReviewBanner'
import { CuriaChambra } from '@/components/board/chamber/CuriaChambra'
import { CouncilVerdict } from '@/components/board/chamber/CouncilVerdict'
import { CouncilInput, type CouncilInputHandle } from '@/components/board/chamber/CouncilInput'
import { getChambraState } from '@/components/board/chamber/chambraStates'
import type { QueryEvent } from '@/lib/llm/query-loop'
import {
  deliberationReducer,
  getInitialDeliberationState,
  contextBadgeLabel,
  contextBadgeColor,
  contextUsagePercent,
} from '@/lib/deliberation/store'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Conversation, Message, Plan, Strategy, StrategyProposal } from '@/types'
import { ContextDisclaimer } from '@/components/ui/ContextDisclaimer'

export default function BoardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingConversationId = searchParams?.get('conversation') ?? null
  const { signOut } = useClerk()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | undefined>(pendingConversationId ?? undefined)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [dismissedReviews, setDismissedReviews] = useState<Set<string>>(new Set())
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [strategyProposal, setStrategyProposal] = useState<StrategyProposal | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deliberation, dispatchDeliberation] = useReducer(
    deliberationReducer,
    getInitialDeliberationState(),
  )
  const inputRef = useRef<CouncilInputHandle>(null)
  const isSendingRef = useRef(false)

  useEffect(() => {
    loadConversations()
    loadPlans()
    loadStrategies()

    const fetchUser = async () => {
      const response = await fetch('/api/auth/session')
      if (!response.ok) return
      const data = await response.json() as { user?: { firstName?: string | null } | null }
      if (data.user) {
        setUserName(data.user.firstName ?? null)
      }
    }
    void fetchUser()
  }, [])

  useEffect(() => {
    if (isSendingRef.current) return  // handleSend is managing messages directly
    if (activeId) loadMessages(activeId)
    else setMessages([])
    setStrategyProposal(null)
  }, [activeId])

  async function loadConversations(silent = false) {
    if (!silent) setLoadingConvs(true)
    const res = await fetch('/api/conversations')
    if (res.ok) {
      const data = await res.json() as Conversation[]
      setConversations(data)
      // Priority order: keep current activeId > handoff via ?conversation=<id> > first conversation.
      setActiveId((cur) => {
        if (cur) {
          return data.some((c) => c.id === cur) ? cur : (data.length > 0 ? data[0].id : undefined)
        }
        if (pendingConversationId && data.some((c) => c.id === pendingConversationId)) {
          return pendingConversationId
        }
        return data.length > 0 ? data[0].id : undefined
      })
    }
    if (!silent) setLoadingConvs(false)
  }

  async function loadPlans() {
    const res = await fetch('/api/plans')
    if (res.ok) setPlans(await res.json())
  }

  async function loadStrategies() {
    const res = await fetch('/api/strategies')
    if (res.ok) setStrategies(await res.json())
  }

  async function loadMessages(convId: string) {
    const res = await fetch(`/api/conversations/${convId}/messages`)
    if (res.ok) setMessages(await res.json())
  }

  async function handleNewConversation(strategyId?: string) {
    // Without strategyId: just reset to home — conversation is created on first send
    if (!strategyId) {
      setActiveId(undefined)
      setMessages([])
      setStrategyProposal(null)
      // Focus input after React re-renders home mode
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }
    // With strategyId: create immediately (needs the FK)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nova estratégia', strategy_id: strategyId }),
    })
    if (res.ok) {
      const conv = await res.json()
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
      setMessages([])
      setStrategyProposal(null)
    }
  }

  async function handleStrategySelect(strategy: Strategy) {
    const strategyConv = conversations
      .filter((c) => c.strategy_id === strategy.id)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
    if (strategyConv) setActiveId(strategyConv.id)
    else await handleNewConversation(strategy.id)
  }

  async function handleStrategySaved(_strategyId: string, _strategyName: string) {
    setStrategyProposal(null)
    await loadStrategies()
    await loadConversations()
  }

  async function handleStartReview(planId: string) {
    const res = await fetch(`/api/plans/${planId}/review`, { method: 'POST' })
    if (res.ok) {
      const conv = await res.json()
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
      setMessages([])
      loadPlans()
    }
  }

  function handleDismissReview(planId: string) {
    setDismissedReviews((prev) => new Set([...prev, planId]))
  }

  function handlePlanScheduled(_planId: string, _reviewDate: string) {
    loadConversations()
    loadPlans()
  }

  const handleSend = useCallback(
    async (text: string) => {
      let convId = activeId
      const isFirstMessage = messages.length === 0

      if (!convId) {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 60) }),
        })
        if (!res.ok) { console.error('[CURIA] create conversation failed:', res.status); return }
        const conv = await res.json()
        convId = conv.id
        isSendingRef.current = true  // block loadMessages race before setActiveId
        setConversations((prev) => [conv, ...prev])
        setActiveId(convId)
      }
      console.log('[CURIA] sending to convId:', convId)

      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: convId!,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsStreaming(true)
      setStreamingContent('')
      setStrategyProposal(null)
      dispatchDeliberation({ type: 'stream_start' })

      try {
        const res = await fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        })

        console.log('[CURIA] POST status:', res.status, 'ok:', res.ok)
        if (!res.ok || !res.body) throw new Error('Stream failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ''
        let lineBuffer = ''

        let deltaCount = 0
        const handleEvent = (event: QueryEvent) => {
          if (event.type === 'delta') {
            full += event.text
            deltaCount++
            if (deltaCount <= 3) console.log('[CURIA] delta #' + deltaCount, event.text.slice(0, 40))
            setStreamingContent(full)
          } else if (event.type === 'done' && event.strategyProposal) {
            setStrategyProposal(event.strategyProposal)
          }
          dispatchDeliberation(event)
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          lineBuffer += decoder.decode(value, { stream: true })

          // Parsear linhas NDJSON completas
          let newlineIdx: number
          while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
            const line = lineBuffer.slice(0, newlineIdx).trim()
            lineBuffer = lineBuffer.slice(newlineIdx + 1)
            if (!line) continue
            try { handleEvent(JSON.parse(line) as QueryEvent) } catch {}
          }
        }
        // Processar resto do buffer
        if (lineBuffer.trim()) {
          try { handleEvent(JSON.parse(lineBuffer.trim()) as QueryEvent) } catch {}
        }

        console.log('[CURIA] stream done. deltas:', deltaCount, 'full length:', full.length)
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: convId!,
          role: 'assistant',
          content: full,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])

        // After first message: generate AI title in background
        if (isFirstMessage) {
          const fid = convId
          fetch(`/api/conversations/${fid}/title`, { method: 'POST' })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
              if (data?.title) {
                setConversations((prev) =>
                  prev.map((c) => c.id === fid ? { ...c, title: data.title } : c)
                )
              }
            })
            .catch(() => {})
        }
        // Always refresh sidebar so conversation appears with up-to-date data
        await loadConversations(true)
      } catch (err) {
        console.error('[CURIA] stream error:', err)
      } finally {
        isSendingRef.current = false
        setIsStreaming(false)
        setStreamingContent('')
        dispatchDeliberation({ type: 'stream_end' })
      }
    },
    [activeId]
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pendingReviews = plans.filter((p) => {
    if (p.status !== 'active' || !p.review_date) return false
    if (dismissedReviews.has(p.id)) return false
    const rd = new Date(p.review_date + 'T00:00:00')
    return rd <= today
  })

  const chambraState = getChambraState({ isStreaming, hasMessages: messages.length > 0, streamingContent })
  const isHomeMode = messages.length === 0 && !isStreaming

  function handleConversationUpdate(updated: Conversation) {
    setConversations((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    // If archived the active conversation, clear it
    if (updated.archived && activeId === updated.id) {
      setActiveId(undefined)
      setMessages([])
    }
  }

  function handleConversationDelete(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) {
      setActiveId(undefined)
      setMessages([])
    }
  }

  return (
    <div className="flex h-screen" style={{ background: '#FDFBF9' }}>
      {/* Sidebar */}
      <aside
        className="shrink-0 transition-all duration-200 overflow-hidden"
        style={{ width: sidebarOpen ? '15rem' : '0', background: '#F5F0EC' }}
      >
        <div className="w-60 h-full">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={() => handleNewConversation()}
            loading={loadingConvs}
            plans={plans}
            onPlanSelect={(plan) => handleStartReview(plan.id)}
            strategies={strategies}
            onStrategySelect={handleStrategySelect}
            onConversationUpdate={handleConversationUpdate}
            onConversationDelete={handleConversationDelete}
            userName={userName ?? undefined}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            sidebarOpen={sidebarOpen}
            onLogout={async () => {
              await signOut({ redirectUrl: '/' })
            }}
          />
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden" style={{ background: '#FDFBF9' }}>
        {/* When sidebar is closed, show a compact open button in main area */}
        {!sidebarOpen && (
          <div className="flex items-center px-3 py-1.5" style={{ minHeight: '40px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#0B0B0F]/40 hover:bg-[#0B0B0F]/[0.06] hover:text-[#0B0B0F]/70 transition-colors"
              title="Abrir sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}

        {/* Review banners */}
        {pendingReviews.map((plan) => (
          <ReviewBanner
            key={plan.id}
            plan={plan}
            onStartReview={handleStartReview}
            onDismiss={handleDismissReview}
          />
        ))}

        {isHomeMode ? (
          /* ── HOME: Chamber + welcome + centered input ── */
          <div className="flex flex-1 flex-col min-h-0 items-center justify-center">
            <div className="w-full min-h-0 relative" style={{ height: '38vh' }}>
              {userName && (
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 md:-top-3">
                  <span className="italic text-[#C9A84C] text-2xl md:text-4xl leading-none">
                    Olá, {userName}
                  </span>
                </div>
              )}
              <CuriaChambra state={chambraState} activeCounselorIds={deliberation.activeCounselorIds} deliberation={deliberation} />
            </div>
            <div className="board-home-content">
              {/* Removed home subtitle per UX request */}
              <div className="w-full px-4">
                <CouncilInput ref={inputRef} onSend={handleSend} isStreaming={isStreaming} variant="home" />
                <p className="mt-2 text-center text-[11px] text-[#0B0B0F]/40">
                  A Curia pode cometer erros. Confira informações importantes.{' '}
                  <a href="/cookies" className="underline hover:opacity-80">Consulte as Preferências de cookies</a>.
                </p>
              </div>
              {/* Quick-start cards */}
              <div className="board-quickstart-grid">
                {[
                  { icon: <GitFork size={14} />,       label: 'Tenho uma decisão difícil',    prompt: 'Preciso deliberar sobre uma decisão importante. ' },
                  { icon: <Compass size={14} />,        label: 'Quero estruturar uma estratégia', prompt: 'Quero estruturar uma estratégia para ' },
                  { icon: <ShieldAlert size={14} />,    label: 'Preciso mapear riscos',        prompt: 'Preciso identificar e mapear os riscos de ' },
                  { icon: <ClipboardCheck size={14} />, label: 'Quero revisar um plano',       prompt: 'Quero revisar meu plano de ação para ' },
                ].map(({ icon, label, prompt }) => (
                  <button
                    key={label}
                    className="board-quickstart-card"
                    onClick={() => inputRef.current?.fill(prompt)}
                  >
                    <span className="board-quickstart-icon">{icon}</span>
                    <span className="board-quickstart-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── CHAT: Câmara compacta + mensagens + input ── */
          <>
            <div className="w-full" style={{ height: '28vh' }}>
              <CuriaChambra state={chambraState} activeCounselorIds={deliberation.activeCounselorIds} deliberation={deliberation} />
            </div>
            <div className="flex flex-1 flex-col min-h-0">
              {(messages.length > 0 || isStreaming) && (
                <div className="px-4 pt-3">
                  <div className="mx-auto max-w-3xl">
                    <ContextDisclaimer />
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                <CouncilVerdict
                  messages={messages}
                  streamingContent={streamingContent}
                  isStreaming={isStreaming}
                />
              </div>
              <div className="mt-auto px-4 pb-4">
                <div className="mx-auto w-full max-w-2xl">
                  <CouncilInput ref={inputRef} onSend={handleSend} isStreaming={isStreaming} variant="chat" />
                  <p className="mt-2 text-center text-[11px] text-[#0B0B0F]/40">
                    A Curia pode cometer erros. Confira informações importantes.{' '}
                    <a href="/cookies" className="underline hover:opacity-80">Consulte as Preferências de cookies</a>.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
