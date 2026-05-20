import { NextResponse } from 'next/server'

export async function POST(request) {
  const { heslo } = await request.json()

  if (heslo !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ chyba: 'Špatné heslo' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_auth', heslo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })

  return response
}
