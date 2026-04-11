import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const pathname = req.nextUrl.pathname

  // --- Admin route protection (cookie-based, no NextAuth) ---
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminLogin = pathname === '/admin-login'

  if (isAdminRoute && !isAdminLogin) {
    const adminSession = req.cookies.get('admin_session')
    if (!adminSession || adminSession.value !== process.env.ADMIN_SESSION_TOKEN) {
      return NextResponse.redirect(new URL('/admin-login', req.url))
    }
  }

  // --- Host route protection (Google auth via NextAuth) ---
  const isLoggedIn = !!req.auth
  const isHostRoute = pathname.startsWith('/host')

  if (isHostRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/host/:path*', '/admin/:path*', '/admin-login'],
}
