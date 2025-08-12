import { createClient } from "@supabase/supabase-js"
import "dotenv/config" // To load .env.local file

async function seedDatabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase URL or Service Role Key is not defined in .env.local")
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Example: Inserting data into a table named 'items'
    const { data, error } = await supabase.from("items").insert([
      { name: "Item 1", description: "Description for Item 1" },
      { name: "Item 2", description: "Description for Item 2" },
    ])

    if (error) {
      console.error("Error seeding database:", error)
    } else {
      console.log("Database seeded successfully:", data)
    }
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

seedDatabase()
  .then(() => console.log("Seeding complete"))
  .catch((error) => console.error("Seeding failed:", error))
