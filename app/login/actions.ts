"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

type State = {
  error: string
} | null

export async function login(previousState: State, formData: FormData): Promise<State> {
  const password = formData.get("password")
  const next = formData.get("next") as string | null

  if (password === process.env.SITE_WIDE_PASSWORD) {
    cookies().set("auth_token", process.env.SITE_WIDE_PASSWORD!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    // Redirect to the originally requested page, or fallback to /admin
    redirect(next || "/admin")
  }

  return {
    error: "Invalid password. Please try again.",
  }
}
