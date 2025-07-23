// This script is intended to be run with `node -r dotenv/config scripts/07-regenerate-slugs.js`
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is not defined in environment variables.")
}

const supabase = createClient(supabaseUrl, supabaseKey)

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

async function regenerateSlugs() {
  console.log("Fetching all brands...")
  const { data: brands, error } = await supabase.from("brands").select("id, name")

  if (error) {
    console.error("Error fetching brands:", error.message)
    return
  }

  if (!brands || brands.length === 0) {
    console.log("No brands found.")
    return
  }

  console.log(`Found ${brands.length} brands. Regenerating slugs...`)

  for (const brand of brands) {
    const newSlug = slugify(brand.name)
    console.log(`Updating brand "${brand.name}" (ID: ${brand.id}) with new slug: "${newSlug}"`)

    const { error: updateError } = await supabase.from("brands").update({ slug: newSlug }).eq("id", brand.id)

    if (updateError) {
      console.error(`Failed to update slug for brand ${brand.name}:`, updateError.message)
    } else {
      console.log(`  -> Success.`)
    }
  }

  console.log("Slug regeneration complete.")
}

regenerateSlugs().catch(console.error)
