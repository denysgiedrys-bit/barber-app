import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { jmeno, email, sluzba, datum, cas } = await request.json()

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Potvrzení rezervace — ${sluzba}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Rezervace potvrzena ✅</h2>
          <p>Dobrý den, <strong>${jmeno}</strong>,</p>
          <p>Vaše rezervace byla úspěšně přijata.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr><td style="padding: 8px; color: #666;">Služba</td><td style="padding: 8px;"><strong>${sluzba}</strong></td></tr>
            <tr><td style="padding: 8px; color: #666;">Datum</td><td style="padding: 8px;"><strong>${datum}</strong></td></tr>
            <tr><td style="padding: 8px; color: #666;">Čas</td><td style="padding: 8px;"><strong>${cas}</strong></td></tr>
          </table>
          <p style="color: #666; font-size: 14px;">Připomínku dostanete den před termínem.</p>
        </div>
      `
    })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ ok: false, error }, { status: 500 })
  }
}