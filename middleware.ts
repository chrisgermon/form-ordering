import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const auth = request.headers.get('authorization');
  const expected = process.env.ADMIN_PASSWORD ?? 'crowdit';

  if (auth && auth.startsWith('Basic ')) {
    const [, base64] = auth.split(' ');
    const decoded = Buffer.from(base64, 'base64').toString();
    const [, password] = decoded.split(':');
    if (password === expected) {
      return NextResponse.next();
    }
  }

  const response = new NextResponse('Authentication required', { status: 401 });
  response.headers.set('WWW-Authenticate', 'Basic realm="admin"');
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
