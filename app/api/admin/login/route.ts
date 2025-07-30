import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const expected = process.env.ADMIN_PASSWORD ?? 'crowdit'
  if (password === expected) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin-auth', 'true', { path: '/', httpOnly: true })
    return res
  }
  return NextResponse.json({ ok: false }, { status: 401 })
}
