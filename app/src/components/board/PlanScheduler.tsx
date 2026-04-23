'use client'

import { useState } from 'react'
import { Calendar, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlanSchedulerProps {
  messageContent: string
  conversationId: string
  conversationTitle: string
  onScheduled: (planId: string, reviewDate: string) => void
}

function extractSection(content: string, markers: string[]): string {
  for (const marker of markers) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`###[^\\n]*${escaped}[^\\n]*\\n([\\s\\S]*?)(?=###|$)`, 'i')
    const match = content.match(regex)
    if (match) return match[1].trim()
  }
  return ''
}

export function PlanScheduler({
  messageContent,
  conversationId,
  conversationTitle,
  onScheduled,
}: PlanSchedulerProps) {
  const [loading, setLoading] = useState(false)
  const [scheduled, setScheduled] = useState(false)

  async function schedule(days: number) {
    setLoading(true)

    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() + days)
    const reviewDateStr = reviewDate.toISOString().split('T')[0]

    const diagnosisText = extractSection(messageContent, ['🔍 Diagnóstico', 'Diagnóstico'])
    const problemText = extractSection(messageContent, ['🎯 Problema Central', 'Problema Central'])
    const summary = [diagnosisText, problemText].filter(Boolean).join('\n\n') ||
      messageContent.slice(0, 600)

    // A seção "▶️ Próximos Passos" foi fundida em "💡 Recomendações Estratégicas"
    // — cada recomendação carrega "Movimento desta semana" + "Como saber que
    // funcionou" dentro dela. O DB field "next_steps" continua existindo
    // (compat com schema), mas recebe agora o bloco de recomendações completo.
    // Fallback para scaffold legado.
    const next_steps =
      extractSection(messageContent, ['💡 Recomendações Estratégicas', 'Recomendações Estratégicas']) ||
      extractSection(messageContent, ['▶️ Próximos Passos', 'Próximos Passos']) ||
      'Ver conversa de origem'

    const frameworkRaw = extractSection(messageContent, ['📐 Framework Aplicado', 'Framework Aplicado'])
    const framework_used = frameworkRaw ? frameworkRaw.split('\n')[0].slice(0, 120) : null

    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        title: conversationTitle,
        summary,
        next_steps,
        framework_used,
        review_date: reviewDateStr,
        review_interval_days: days,
      }),
    })

    if (res.ok) {
      const plan = await res.json()
      setScheduled(true)
      onScheduled(plan.id, reviewDateStr)
    }

    setLoading(false)
  }

  if (scheduled) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
        <Check className="h-4 w-4 shrink-0 text-green-500" />
        Revisão agendada. A Curia vai lembrar você.
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/50%)] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        <Calendar className="h-3.5 w-3.5" />
        Agendar revisão deste plano
      </div>
      <div className="flex flex-wrap gap-2">
        {[7, 14, 30].map((days) => (
          <Button
            key={days}
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => schedule(days)}
          >
            Em {days} dias
          </Button>
        ))}
      </div>
    </div>
  )
}
