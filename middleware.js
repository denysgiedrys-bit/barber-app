import { NextResponse } from 'next/server'

export function middleware(request) {
  const auth = request.cookies.get('admin_auth')?.value
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  if (!isLoginPage && auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
