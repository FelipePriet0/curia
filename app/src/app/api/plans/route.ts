import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/metrics/track'

// GET /api/plans — list all plans for current user
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/plans — create a plan from a conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    conversation_id,
    title,
    summary,
    next_steps,
    metrics,
    framework_used,
    review_date,
    review_interval_days,
  } = body

  if (!title || !summary || !next_steps) {
    return NextResponse.json(
      { error: 'title, summary and next_steps are required' },
      { status: 400 }
    )
  }

  // Verify conversation ownership if provided
  if (conversation_id) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single()
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const { data: plan, error } = await supabase
    .from('plans')
    .insert({
      user_id: user.id,
      origin_conversation_id: conversation_id || null,
      title,
      summary,
      next_steps,
      metrics: metrics || null,
      framework_used: framework_used || null,
      review_date: review_date || null,
      review_interval_days: review_interval_days || 14,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark origin conversation as plan_origin
  if (conversation_id) {
    await supabase
      .from('conversations')
      .update({ conversation_type: 'plan_origin' })
      .eq('id', conversation_id)
  }

  // Track events
  await trackEvent(supabase as any, {
    userId: user.id,
    conversationId: conversation_id,
    type: 'plan_created',
    metadata: { plan_id: plan.id },
  })

  if (review_date) {
    await trackEvent(supabase as any, {
      userId: user.id,
      conversationId: conversation_id,
      type: 'review_scheduled',
      metadata: { plan_id: plan.id, review_date },
    })
  }

  return NextResponse.json(plan, { status: 201 })
}
