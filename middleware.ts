import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin/login') || pathname.startsWith('/api/admin/login')) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('admin-auth')?.value
  if (authCookie === 'true') {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('returnTo', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
