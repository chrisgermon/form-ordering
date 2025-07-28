import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // We'll use the site-wide password as the auth token for simplicity.
  const authToken = request.cookies.get("auth_token")?.value

  // This is a simplified check. In a real app, you'd verify a JWT or session token.
  const isAuthenticated = authToken === process.env.SITE_WIDE_PASSWORD

  const { pathname } = request.nextUrl

  // If a user tries to access any admin route and is not authenticated,
  // redirect them to the login page.
  if (pathname.startsWith("/admin") && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    // Pass the intended destination as a query parameter
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If an authenticated user tries to access the login page,
  // redirect them to the admin dashboard.
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Protect all admin routes and the login page.
  matcher: ["/admin/:path*", "/login"],
}
