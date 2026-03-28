import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/strategies — list user strategies (most recent first)
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('strategies')
    .select('id, name, brief, stage, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/strategies — create strategy and link current conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, brief, stage, conversation_id } = await req.json()

  if (!name?.trim() || !brief?.trim()) {
    return NextResponse.json({ error: 'name and brief are required' }, { status: 400 })
  }

  // Create the strategy
  const { data: strategy, error: strategyError } = await supabase
    .from('strategies')
    .insert({ user_id: user.id, name: name.trim(), brief: brief.trim(), stage: stage ?? null })
    .select()
    .single()

  if (strategyError || !strategy) {
    return NextResponse.json({ error: strategyError?.message ?? 'Failed to create strategy' }, { status: 500 })
  }

  // Link the originating conversation to this strategy
  if (conversation_id) {
    await supabase
      .from('conversations')
      .update({ strategy_id: strategy.id, conversation_type: 'strategy' })
      .eq('id', conversation_id)
      .eq('user_id', user.id)
  }

  return NextResponse.json(strategy, { status: 201 })
}
