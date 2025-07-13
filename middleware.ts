import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This middleware restricts access to form pages based on IP address.
// It uses the Supabase service role key for secure, direct database access from the edge.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function middleware(request: NextRequest) {
  // IP restriction is temporarily disabled.
  return NextResponse.next()

  // 1. Define which paths to protect. We only care about the public forms.
  // if (!request.nextUrl.pathname.startsWith("/forms/")) {
  //   return NextResponse.next()
  // }

  // 2. Fetch the list of allowed IPs from the database.
  // const { data: allowedIps, error } = await supabase.from("allowed_ips").select("ip_address")

  // if (error) {
  //   console.error("Middleware Error: Could not fetch allowed IPs.", error.message)
  //   // For security, we "fail closed", blocking access if the database check fails.
  //   return NextResponse.redirect(new URL("/access-denied?error=db_error", request.url))
  // }

  // 3. If the allowed list is empty, allow all traffic.
  // if (!allowedIps || allowedIps.length === 0) {
  //   return NextResponse.next()
  // }

  // 4. Get the visitor's IP address.
  // `request.ip` is the recommended way in Next.js middleware.
  // const ip = request.ip ?? "unknown"

  // 5. Check if the visitor's IP is in the allowed list.
  // This currently checks for an exact match.
  // const isAllowed = allowedIps.some((allowed) => allowed.ip_address === ip)

  // if (isAllowed) {
  //   // 6. If allowed, continue to the requested page.
  //   return NextResponse.next()
  // } else {
  //   // 7. If not allowed, block access.
  //   console.log(`Blocked access for IP: ${ip} to ${request.nextUrl.pathname}`)
  //   return NextResponse.redirect(new URL("/access-denied", request.url))
  // }
}

// Configure the middleware to run only on the public form pages.
export const config = {
  matcher: "/forms/:path*",
}
