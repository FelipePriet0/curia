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
      <div className="rounded-xl border border-[#0B0B0F]/25 bg-[#0B0B0F]/[0.05] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <BookmarkPlus className="mt-0.5 h-4 w-4 shrink-0 text-[#0B0B0F]" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0B0B0F]">
                Isso virou uma estratégia
              </p>
              <p className="mt-0.5 text-xs text-[#0B0B0F]/60 truncate">
                {proposal.name}
              </p>
              <p className="mt-2 text-[11px] text-[#0B0B0F]/50">
                Revise criticamente antes de implementar. Este conteúdo não substitui assessoria profissional.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#0B0B0F] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={onDismiss}
              className="rounded-lg p-1.5 text-[#0B0B0F]/40 transition-colors hover:text-[#0B0B0F]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
