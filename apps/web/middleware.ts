import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isHostRoute = req.nextUrl.pathname.startsWith('/host')

  if (isHostRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Only protect host routes — /join is open to anonymous players
  matcher: ['/host/:path*'],
}
