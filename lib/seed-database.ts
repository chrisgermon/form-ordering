import type { SupabaseClient } from "@supabase/supabase-js"

export async function seedDatabase(supabase: SupabaseClient) {
  console.log("--- Starting Database Seeding ---")

  const { data: existingBrands, error: checkError } = await supabase.from("brands").select("id").limit(1)

  if (checkError) {
    console.error("Error checking for existing brands:", checkError)
    throw checkError
  }

  if (existingBrands.length > 0) {
    console.log("Database already contains brands. Skipping seed.")
    return
  }

  console.log("Seeding database with initial brands...")
  const brandsToCreate = [
    { name: "Vision Radiology", slug: "vision-radiology", active: true, emails: [], clinic_locations: [] },
    { name: "Light Radiology", slug: "light-radiology", active: true, emails: [], clinic_locations: [] },
    {
      name: "Quantum Medical Imaging",
      slug: "quantum-medical-imaging",
      active: true,
      emails: [],
      clinic_locations: [],
    },
    { name: "Focus Radiology", slug: "focus-radiology", active: true, emails: [], clinic_locations: [] },
    { name: "Pulse Radiology", slug: "pulse-radiology", active: true, emails: [], clinic_locations: [] },
  ]

  const { error } = await supabase.from("brands").insert(brandsToCreate)

  if (error) {
    console.error("Error seeding database:", error)
    throw error
  }

  console.log("✅ Database seeded successfully.")
  console.log("--- Database Seeding Complete ---")
}
