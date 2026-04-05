import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'

// POST /api/conversations/[id]/share — create a public share token
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdmin()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify conversation ownership
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const token = generateToken()

  const { data: share, error } = await admin
    .from('shared_conversations')
    .insert({ user_id: user.id, conversation_id: id, token })
    .select('id, token, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = `/share/${share.token}`
  return NextResponse.json({ url, token: share.token })
}

// DELETE /api/conversations/[id]/share — revoke all active share links for this conversation
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdmin()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify conversation ownership
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin
    .from('shared_conversations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .is('revoked_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

function generateToken(): string {
  // URL‑safe, 32 chars
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Buffer.from(bytes).toString('base64url')
}

