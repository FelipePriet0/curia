import { db } from '@/db/client'
import { events } from '@/db/schema'

type EventType =
  | 'activation_started'
  | 'conversation_started'
  | 'flow_progressed'
  | 'plan_requested'
  | 'plan_created'
  | 'review_scheduled'
  | 'review_completed'

export async function trackEvent(opts: {
  userId: string
  conversationId?: string
  type: EventType
  metadata?: Record<string, unknown>
}) {
  try {
    await db.insert(events).values({
      userId: opts.userId,
      conversationId: opts.conversationId ?? null,
      type: opts.type,
      metadata: opts.metadata ?? null,
    })
  } catch (e) {
    console.warn('[metrics] trackEvent failed', e)
  }
}
