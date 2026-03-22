'use client'

import { Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { Conversation } from '@/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onNew: () => void
  loading?: boolean
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--brand-radius-md)] bg-[hsl(var(--primary))]">
            <span className="text-xs font-bold text-[hsl(var(--primary-foreground))]">AI</span>
          </div>
          <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Board</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onNew} title="New conversation">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="space-y-1 p-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-[var(--radius)] bg-[hsl(var(--muted))] animate-pulse"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="h-8 w-8 text-[hsl(var(--muted-foreground))] mb-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              No conversations yet.
              <br />
              Ask your Board something.
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full text-left rounded-[var(--radius)] px-3 py-2 text-sm transition-colors truncate',
                activeId === conv.id
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
            >
              {conv.title}
            </button>
          ))
        )}
      </nav>
    </div>
  )
}
