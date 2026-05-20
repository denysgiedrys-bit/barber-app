import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const { data } = await supabase
    .from('rezervace')
    .select('jmeno, sluzba, datum, cas')
    .eq('cancel_token', token)
    .single()

  if (!data) return Response.json({ error: 'Rezervace nenalezena' }, { status: 404 })
  return Response.json(data)
}

export async function DELETE(request) {
  const { token } = await request.json()

  const { error } = await supabase
    .from('rezervace')
    .delete()
    .eq('cancel_token', token)

  if (error) return Response.json({ error: 'Chyba' }, { status: 500 })
  return Response.json({ ok: true })
}
