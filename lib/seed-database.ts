import { createAdminClient } from "@/utils/supabase/server"

// This function initializes the database with a clean slate of brands.
// It first wipes all existing data to prevent conflicts.
export default async function initializeDatabase() {
  const supabase = createAdminClient()

  console.log("--- Starting Database Initialization ---")

  // 1. Clear all existing data in the correct order to respect foreign keys
  console.log("Step 1: Clearing existing data...")
  await supabase.from("product_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await supabase.from("product_sections").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await supabase.from("brands").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  console.log("✅ Data cleared.")

  // 2. Insert the 5 specified brands with default empty/null values.
  // You can edit these details later in the Admin Dashboard.
  console.log("Step 2: Creating the 5 core brands...")
  const brandsToCreate = [
    {
      name: "Vision Radiology",
      slug: "vision-radiology",
      active: true,
      emails: [],
      clinic_locations: [],
    },
    {
      name: "Light Radiology",
      slug: "light-radiology",
      active: true,
      emails: [],
      clinic_locations: [],
    },
    {
      name: "Quantum Medical Imaging",
      slug: "quantum-medical-imaging",
      active: true,
      emails: [],
      clinic_locations: [],
    },
    {
      name: "Focus Radiology",
      slug: "focus-radiology",
      active: true,
      emails: [],
      clinic_locations: [],
    },
    {
      name: "Pulse Radiology",
      slug: "pulse-radiology",
      active: true,
      emails: [],
      clinic_locations: [],
    },
  ]

  const { error } = await supabase.from("brands").insert(brandsToCreate)

  if (error) {
    console.error("❌ Error creating brands:", error)
    throw new Error(`Brand creation failed: ${error.message}`)
  }

  console.log("✅ 5 brands created successfully.")
  console.log("--- Database Initialization Complete ---")
}
