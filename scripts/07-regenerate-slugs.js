import { createClient } from "@supabase/supabase-js"

// This script requires the following environment variables to be set:
// NEXT_PUBLIC_SUPABASE_URL: Your project's Supabase URL.
// SUPABASE_SERVICE_ROLE_KEY: Your project's service_role key for admin access.

/**
 * A simple function to convert a string into a URL-friendly slug.
 * Example: "My Awesome Brand!" -> "my-awesome-brand"
 * @param {string} text The text to slugify.
 * @returns {string} The slugified text.
 */
const slugify = (text) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

async function regenerateSlugs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Supabase URL or Service Role Key is not defined in your environment variables.")
    console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
    process.exit(1)
  }

  // Create a Supabase client with admin privileges
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log("Fetching all brands from the database...")
  const { data: brands, error: fetchError } = await supabase.from("brands").select("id, name")

  if (fetchError) {
    console.error("Error fetching brands:", fetchError.message)
    return
  }

  if (!brands || brands.length === 0) {
    console.log("No brands found to process.")
    return
  }

  console.log(`Found ${brands.length} brands. Regenerating slugs...`)

  const updatePromises = brands.map(async (brand) => {
    if (!brand.name) {
      console.warn(`Brand with ID ${brand.id} has no name and will be skipped.`)
      return null
    }

    const newSlug = slugify(brand.name)
    console.log(`  - Updating Brand: "${brand.name}" (ID: ${brand.id}) -> New Slug: "${newSlug}"`)

    const { error: updateError } = await supabase.from("brands").update({ slug: newSlug }).eq("id", brand.id)

    if (updateError) {
      console.error(`    [FAILED] to update slug for brand ID ${brand.id}:`, updateError.message)
      return updateError
    }
    return null
  })

  const results = await Promise.all(updatePromises)
  const failedUpdates = results.filter((r) => r !== null)

  if (failedUpdates.length > 0) {
    console.error(`\nFinished with ${failedUpdates.length} errors.`)
  } else {
    console.log("\nSuccessfully regenerated all brand slugs!")
  }
}

regenerateSlugs()
