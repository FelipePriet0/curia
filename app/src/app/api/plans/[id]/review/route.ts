import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/metrics/track'

// POST /api/plans/[id]/review — start a review session (creates linked conversation)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify plan ownership
  const { data: plan } = await supabase
    .from('plans')
    .select('id, title, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const reviewTitle = `Revisão — ${plan.title}`

  // Create review conversation linked to the plan
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title: reviewTitle,
      plan_id: id,
      conversation_type: 'plan_review',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark plan as reviewed if still active
  if (plan.status === 'active') {
    await supabase
      .from('plans')
      .update({ status: 'reviewed' })
      .eq('id', id)
  }

  await trackEvent(supabase as any, {
    userId: user.id,
    conversationId: conversation.id,
    type: 'review_completed',
    metadata: { plan_id: id },
  })

  return NextResponse.json(conversation, { status: 201 })
}
