import { createAdminClient } from "../utils/supabase/server.js"
import { importForm } from "../app/admin/actions.js"

const JOTFORM_URL = "https://form.jotform.com/250770693331457"
const BRAND_SLUG = "focus-radiology"

async function main() {
  console.log(`Starting form import for: ${BRAND_SLUG}`)
  const supabase = createAdminClient()

  // 1. Find the brand in the database
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, slug")
    .eq("slug", BRAND_SLUG)
    .single()

  if (brandError || !brand) {
    console.error(`❌ Error: Could not find brand with slug '${BRAND_SLUG}'.`, brandError)
    return
  }
  console.log(`✅ Found brand: ${brand.slug} (ID: ${brand.id})`)

  // 2. Run the AI import function
  console.log(`🤖 Calling AI to import form from: ${JOTFORM_URL}`)
  const result = await importForm(brand.id, brand.slug, { url: JOTFORM_URL })

  // 3. Log the result
  if (result.success) {
    console.log(`✅🎉 Success! ${result.message}`)
  } else {
    console.error(`❌ Error during import: ${result.message}`)
  }

  console.log("--- Import process complete ---")
}

main()
