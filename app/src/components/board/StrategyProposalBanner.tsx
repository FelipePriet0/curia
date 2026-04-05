'use client'

import { useState } from 'react'
import { BookmarkPlus, X } from 'lucide-react'
import type { StrategyProposal } from '@/types'

interface StrategyProposalBannerProps {
  proposal: StrategyProposal
  conversationId: string
  onSaved: (strategyId: string, strategyName: string) => void
  onDismiss: () => void
}

export function StrategyProposalBanner({
  proposal,
  conversationId,
  onSaved,
  onDismiss,
}: StrategyProposalBannerProps) {
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: proposal.name,
          brief: proposal.brief,
          stage: proposal.stage,
          conversation_id: conversationId,
        }),
      })
      if (res.ok) {
        const strategy = await res.json()
        onSaved(strategy.id, strategy.name)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-4">
      <div className="rounded-xl border border-[#FF6F1E]/25 bg-[#FF6F1E]/[0.05] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <BookmarkPlus className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6F1E]" />
            <div className="min-w-0">
              <p className="font-curia-serif text-sm font-medium text-[#2B1A07]">
                Isso virou uma estratégia
              </p>
              <p className="mt-0.5 font-curia-serif text-xs text-[#2B1A07]/60 truncate">
                {proposal.name}
              </p>
              <p className="mt-2 font-curia-serif text-[11px] text-[#2B1A07]/50">
                Revise criticamente antes de implementar. Este conteúdo não substitui assessoria profissional.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#FF6F1E] px-3 py-1.5 font-curia-serif text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={onDismiss}
              className="rounded-lg p-1.5 text-[#2B1A07]/40 transition-colors hover:text-[#2B1A07]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
