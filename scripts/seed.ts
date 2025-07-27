import seedDatabase from "../lib/seed-database"

async function main() {
  try {
    console.log("Starting database seed...")
    await seedDatabase()
    console.log("Database seeding finished successfully.")
  } catch (error) {
    console.error("Failed to seed database:", error)
    process.exit(1)
  }
}

main()
