'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { ConversationList } from '@/components/board/ConversationList'
import { ReviewBanner } from '@/components/board/ReviewBanner'
import { CuriaChambra } from '@/components/board/chamber/CuriaChambra'
import { CouncilVerdict } from '@/components/board/chamber/CouncilVerdict'
import { CouncilInput } from '@/components/board/chamber/CouncilInput'
import { getChambraState } from '@/components/board/chamber/chambraStates'
import { hasStrategyProposal, extractStrategyProposal, stripStrategyMarker } from '@/lib/metrics/detectors'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message, Plan, Strategy, StrategyProposal } from '@/types'

export default function BoardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | undefined>()
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [dismissedReviews, setDismissedReviews] = useState<Set<string>>(new Set())
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [strategyProposal, setStrategyProposal] = useState<StrategyProposal | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    loadConversations()
    loadPlans()
    loadStrategies()

    // Fetch user name from Supabase auth
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const full = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? null
        // Use only first name
        setUserName(full ? full.split(' ')[0] : null)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
    else setMessages([])
    setStrategyProposal(null)
  }, [activeId])

  async function loadConversations() {
    setLoadingConvs(true)
    const res = await fetch('/api/conversations')
    if (res.ok) {
      const data = await res.json()
      setConversations(data)
      if (data.length > 0 && !activeId) setActiveId(data[0].id)
    }
    setLoadingConvs(false)
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
    const body: Record<string, string> = { title: 'New conversation' }
    if (strategyId) body.strategy_id = strategyId
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const conv = await res.json()
      await loadConversations()
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

      if (!convId) {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New conversation' }),
        })
        if (!res.ok) return
        const conv = await res.json()
        convId = conv.id
        setConversations((prev) => [conv, ...prev])
        setActiveId(convId)
      }

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

      try {
        const res = await fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        })

        if (!res.ok || !res.body) throw new Error('Stream failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          full += chunk
          setStreamingContent(full)
        }

        if (hasStrategyProposal(full)) {
          const proposal = extractStrategyProposal(full)
          if (proposal) setStrategyProposal(proposal)
        }

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: convId!,
          role: 'assistant',
          content: stripStrategyMarker(full),
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
        await loadConversations()
      } catch (err) {
        console.error('[BoardPage] Stream error:', err)
      } finally {
        setIsStreaming(false)
        setStreamingContent('')
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

  return (
    <div className="flex h-screen" style={{ background: '#FDFBF9' }}>
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[hsl(var(--border))]" style={{ background: '#F5F0EC' }}>
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
        />
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden" style={{ background: '#FDFBF9' }}>
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
            <div className="w-full min-h-0" style={{ height: '38vh' }}>
              <CuriaChambra state={chambraState} />
            </div>
            <div className="board-home-content">
              <div className="board-welcome">
                <h1 className="board-welcome-title">
                  Olá{userName ? `, ${userName}` : ''}
                </h1>
                <p className="board-welcome-sub">
                  Qual é o seu maior desafio estratégico hoje?
                </p>
              </div>
              <CouncilInput onSend={handleSend} isStreaming={isStreaming} variant="home" />
            </div>
          </div>
        ) : (
          /* ── CHAT: Chamber (compact) + verdict + input ── */
          <>
            <div className="w-full" style={{ height: '28vh' }}>
              <CuriaChambra state={chambraState} />
            </div>
            <CouncilVerdict
              messages={messages}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
            />
            <CouncilInput onSend={handleSend} isStreaming={isStreaming} variant="chat" />
          </>
        )}
      </main>
    </div>
  )
}
