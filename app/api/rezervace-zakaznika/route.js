import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const telefon = searchParams.get('telefon')

  if (!telefon) return Response.json({ error: 'Chybí telefon' }, { status: 400 })

  const dnes = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('rezervace')
    .select('id, jmeno, sluzba, datum, cas, cancel_token')
    .eq('telefon', telefon)
    .gte('datum', dnes)
    .order('datum')
    .order('cas')

  if (error) return Response.json({ error: 'Chyba' }, { status: 500 })
  return Response.json(data || [])
}
