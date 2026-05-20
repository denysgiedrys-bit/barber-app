import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const zitra = new Date()
  zitra.setDate(zitra.getDate() + 1)
  const zitраStr = zitra.toISOString().split('T')[0]

  const { data: rezervace } = await supabase
    .from('rezervace')
    .select('*')
    .eq('datum', zitраStr)
    .not('email', 'is', null)

  if (!rezervace || rezervace.length === 0) {
    return Response.json({ ok: true, odeslano: 0 })
  }

  let odeslano = 0
  for (const r of rezervace) {
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: r.email,
        subject: `Připomínka — zítra máte rezervaci (${r.sluzba})`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>Připomínka rezervace ✂️</h2>
            <p>Dobrý den, <strong>${r.jmeno}</strong>,</p>
            <p>Připomínáme Vám, že zítra máte rezervaci.</p>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
              <tr><td style="padding: 8px; color: #666;">Služba</td><td style="padding: 8px;"><strong>${r.sluzba}</strong></td></tr>
              <tr><td style="padding: 8px; color: #666;">Datum</td><td style="padding: 8px;"><strong>${r.datum}</strong></td></tr>
              <tr><td style="padding: 8px; color: #666;">Čas</td><td style="padding: 8px;"><strong>${r.cas?.slice(0,5)}</strong></td></tr>
            </table>
            <p style="color: #666; font-size: 14px;">Těšíme se na Vás!</p>
          </div>
        `
      })
      odeslano++
    } catch (e) {
      console.error('Chyba při odesílání emailu:', e)
    }
  }

  return Response.json({ ok: true, odeslano })
}
