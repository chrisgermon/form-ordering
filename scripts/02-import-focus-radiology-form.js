import { createClient } from "@supabase/supabase-js"
import { importForm } from "../app/admin/actions.js"

const JOTFORM_URL = "https://form.jotform.com/250770693331457"
const BRAND_SLUG = "focus-radiology"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const formStructure = {
  "A4 Request Pads": [
    "General",
    "Dental",
    "Cardiology",
    "Obstetric",
    "Sports Imaging",
    "Spinal",
    "Podiatry",
    "Workers Comp",
  ],
  "A5 Request Pads": ["General", "Dental", "Cardiology", "Obstetric"],
  "DL Request Pads": ["General", "Dental"],
  "Patient Prep Pads": ["General Prep", "Barium Enema", "CT Prep", "IV Contrast"],
  "Report & Film Delivery": ["Report Folder", "Report Envelope", "Film Bag (Small)", "Film Bag (Large)"],
  "Marketing Material": ["Business Cards", "Practice Profile", "Web Based Image & Report Access"],
}

async function main() {
  console.log(`Starting form import for: ${BRAND_SLUG}`)

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

  // 4. Iterate over the form structure and insert sections and items
  let sectionSortOrder = 0
  for (const sectionTitle in formStructure) {
    console.log(`Processing section: ${sectionTitle}`)

    // Insert section
    const { data: sectionData, error: sectionError } = await supabase
      .from("sections")
      .insert({
        brand_id: brand.id,
        title: sectionTitle,
        sort_order: sectionSortOrder,
      })
      .select()
      .single()

    if (sectionError) {
      console.error(`Error inserting section "${sectionTitle}":`, sectionError)
      continue // Skip to next section
    }
    const sectionId = sectionData.id
    console.log(`  - Inserted section with ID: ${sectionId}`)

    // Insert items for this section
    const itemsToInsert = formStructure[sectionTitle].map((itemName, index) => ({
      section_id: sectionId,
      name: itemName,
      sort_order: index,
    }))

    const { error: itemsError } = await supabase.from("items").insert(itemsToInsert)

    if (itemsError) {
      console.error(`Error inserting items for section "${sectionTitle}":`, itemsError)
    } else {
      console.log(`  - Successfully inserted ${itemsToInsert.length} items.`)
    }

    sectionSortOrder++
  }

  console.log("--- Import process complete ---")
}

main()
