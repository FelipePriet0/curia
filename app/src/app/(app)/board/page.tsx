'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { ConversationList } from '@/components/board/ConversationList'
import { ChatArea } from '@/components/board/ChatArea'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/types'

export default function BoardPage() {
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | undefined>()
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeId) loadMessages(activeId)
    else setMessages([])
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

  async function loadMessages(convId: string) {
    const res = await fetch(`/api/conversations/${convId}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
  }

  async function handleNewConversation() {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New conversation' }),
    })
    if (res.ok) {
      const conv = await res.json()
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
      setMessages([])
    }
  }

  const handleSend = useCallback(
    async (text: string) => {
      let convId = activeId

      // Auto-create conversation if none selected
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

      // Optimistically add user message
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

        // Add completed assistant message
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: convId!,
          role: 'assistant',
          content: full,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])

        // Update conversation title in sidebar
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

  return (
    <div className="flex h-screen bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar))]">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={handleNewConversation}
          loading={loadingConvs}
        />
      </aside>

      {/* Main chat */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatArea
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          onSend={handleSend}
          conversationId={activeId}
        />
      </main>
    </div>
  )
}
