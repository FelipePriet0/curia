import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/strategies/[id] — strategy details + its conversations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: strategy, error } = await supabase
    .from('strategies')
    .select('id, name, brief, stage, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !strategy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('strategy_id', id)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return NextResponse.json({ ...strategy, conversations: conversations ?? [] })
}

// PATCH /api/strategies/[id] — update strategy brief after a session
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brief, stage } = await req.json()

  if (!brief?.trim()) {
    return NextResponse.json({ error: 'brief is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('strategies')
    .update({
      brief: brief.trim(),
      ...(stage ? { stage } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
