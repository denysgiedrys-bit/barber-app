import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { jmeno, email, sluzba, datum, cas, cancelToken } = await request.json()
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const cancelUrl = cancelToken ? `${appUrl}/zrusit?token=${cancelToken}` : null

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `matescutz — potvrzení rezervace`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #fbbf24;">✂️ matescutz</h2>
          <h3>Rezervace potvrzena ✅</h3>
          <p>Dobrý den, <strong>${jmeno}</strong>,</p>
          <p>Vaše rezervace byla úspěšně přijata.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr><td style="padding: 8px; color: #666;">Služba</td><td style="padding: 8px;"><strong>${sluzba}</strong></td></tr>
            <tr><td style="padding: 8px; color: #666;">Datum</td><td style="padding: 8px;"><strong>${datum}</strong></td></tr>
            <tr><td style="padding: 8px; color: #666;">Čas</td><td style="padding: 8px;"><strong>${cas}</strong></td></tr>
          </table>
          ${cancelUrl ? `
          <p style="margin-top: 24px;">
            <a href="${cancelUrl}" style="color: #ef4444; font-size: 14px;">Zrušit rezervaci</a>
          </p>
          ` : ''}
          <p style="color: #666; font-size: 14px;">Připomínku dostanete den před termínem.</p>
        </div>
      `
    })
    if (error) {
      console.error('Resend error:', error)
      return Response.json({ ok: false, error: error.message }, { status: 500 })
    }
    return Response.json({ ok: true, id: data?.id })
  } catch (error) {
    console.error('send-email exception:', error)
    return Response.json({ ok: false, error: error?.message || String(error) }, { status: 500 })
  }
}
