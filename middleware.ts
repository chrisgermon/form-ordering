import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD ?? 'crowdit'

  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  const auth = request.headers.get('authorization')
  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const [, pass = ''] = (typeof atob === 'function'
        ? atob(encoded)
        : Buffer.from(encoded, 'base64').toString()).split(':')
      if (pass === password) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  })
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
