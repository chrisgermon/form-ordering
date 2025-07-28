import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// This route is for one-time setup of the admin user.
// It's recommended to delete this file after the user has been created successfully.
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const email = "chris@crowdit.com.au"
  const password = "password"

  try {
    // Step 1: Check if a user with this email already exists.
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers({ email })

    if (listError) {
      throw new Error(`Error listing users: ${listError.message}`)
    }

    // Step 2: If the user exists, delete them to ensure a clean slate.
    if (users && users.length > 0) {
      const existingUser = users.find((u) => u.email === email)
      if (existingUser) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
        if (deleteError) {
          throw new Error(`Failed to delete existing user: ${deleteError.message}`)
        }
      }
    }

    // Step 3: Create the new admin user.
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Automatically confirm the user's email
    })

    if (createError) {
      throw new Error(`Failed to create admin user: ${createError.message}`)
    }

    return NextResponse.json({
      message: "Admin user created successfully.",
      user: data.user,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
