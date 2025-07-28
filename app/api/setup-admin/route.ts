import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// This route is for one-time setup of the admin user.
// It's recommended to delete this file after the user has been created successfully.
export async function GET() {
  // Ensure you have these environment variables set in your Vercel project.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 })
  }

  // IMPORTANT: We use the service_role key here to bypass RLS and have admin privileges.
  // This is why this route should be deleted after use.
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const email = "chris@crowdit.com.au"
  const password = "password"

  // Check if user already exists
  const {
    data: { users },
    error: listError,
  } = await supabaseAdmin.auth.admin.listUsers({ email })
  if (listError) {
    return NextResponse.json({ error: `Error checking for user: ${listError.message}` }, { status: 500 })
  }

  if (users && users.length > 0) {
    return NextResponse.json({ message: "Admin user already exists." }, { status: 200 })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Automatically confirm the user's email
  })

  if (error) {
    return NextResponse.json({ error: `Failed to create admin user: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    message: "Admin user created successfully.",
    user: data.user,
  })
}
