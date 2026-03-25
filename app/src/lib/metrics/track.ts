import type { SupabaseClient } from '@supabase/supabase-js'

type EventType =
  | 'activation_started'
  | 'conversation_started'
  | 'flow_progressed'
  | 'plan_requested'
  | 'plan_created'
  | 'review_scheduled'
  | 'review_completed'

export async function trackEvent(
  supabase: SupabaseClient,
  opts: {
    userId: string
    conversationId?: string
    type: EventType
    metadata?: Record<string, unknown>
  }
) {
  try {
    await supabase.from('events').insert({
      user_id: opts.userId,
      conversation_id: opts.conversationId ?? null,
      type: opts.type,
      metadata: opts.metadata ?? null,
    })
  } catch (e) {
    // Best-effort; do not break core flow
    console.warn('[metrics] trackEvent failed', e)
  }
}

