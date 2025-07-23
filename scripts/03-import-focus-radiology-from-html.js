// This script is intended to be run with `node -r dotenv/config scripts/03-import-focus-radiology-from-html.js`
// It's designed to be idempotent, so it can be run multiple times without creating duplicates.

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is not defined in environment variables.")
}

const supabase = createClient(supabaseUrl, supabaseKey)

const formStructure = {
  "A4 Request Pads": [
    { name: "General", code: "A4GP" },
    { name: "Dental", code: "A4DP" },
    { name: "Cardiology", code: "A4CP" },
    { name: "Obstetric", code: "A4OP" },
    { name: "Sports Imaging", code: "A4SP" },
    { name: "Spinal", code: "A4PN" },
    { name: "Podiatry", code: "A4PO" },
    { name: "Workers Comp", code: "A4WC" },
  ],
  "A5 Request Pads": [
    { name: "General", code: "A5GP" },
    { name: "Dental", code: "A5DP" },
    { name: "Cardiology", code: "A5CP" },
    { name: "Obstetric", code: "A5OP" },
  ],
  "DL Request Pads": [
    { name: "General", code: "DLGP" },
    { name: "Dental", code: "DLDP" },
  ],
  "Patient Prep Pads": [
    { name: "General Prep", code: "GPP" },
    { name: "Barium Enema", code: "BEP" },
    { name: "CT Prep", code: "CTP" },
    { name: "IV Contrast", code: "IVP" },
  ],
  "Report & Film Delivery": [
    { name: "Report Folder", code: "RF" },
    { name: "Report Envelope", code: "RE" },
    { name: "Film Bag (Small)", code: "FBS" },
    { name: "Film Bag (Large)", code: "FBL" },
  ],
  "Marketing Material": [
    { name: "Business Cards", code: "BC" },
    { name: "Practice Profile", code: "PP" },
    { name: "Web Based Image & Report Access", code: "WEB" },
  ],
}

async function importForm() {
  console.log("Starting import for Focus Radiology form...")

  // 1. Get the brand ID for 'focus-radiology'
  const { data: brandData, error: brandError } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", "focus-radiology")
    .single()

  if (brandError || !brandData) {
    console.error("Error fetching brand:", brandError?.message || "Brand not found")
    return
  }
  const brandId = brandData.id
  console.log(`Found brand ID for Focus Radiology: ${brandId}`)

  // Clear existing form data for this brand to ensure idempotency
  console.log("Clearing existing form data for this brand...")
  const { data: existingSections, error: fetchError } = await supabase
    .from("sections")
    .select("id")
    .eq("brand_id", brandId)

  if (fetchError) {
    console.error("Could not fetch existing sections to delete.", fetchError.message)
    return
  }

  if (existingSections && existingSections.length > 0) {
    const sectionIds = existingSections.map((s) => s.id)
    // Items have ON DELETE CASCADE, so they will be deleted with sections
    const { error: deleteError } = await supabase.from("sections").delete().in("id", sectionIds)
    if (deleteError) {
      console.error("Failed to delete old sections:", deleteError.message)
      return
    }
    console.log(`Deleted ${existingSections.length} old sections and their items.`)
  }

  // 2. Iterate over the form structure and insert sections and items
  let sectionSortOrder = 0
  for (const sectionTitle in formStructure) {
    console.log(`Processing section: ${sectionTitle}`)

    // Insert section
    const { data: sectionData, error: sectionError } = await supabase
      .from("sections")
      .insert({
        brand_id: brandId,
        title: sectionTitle,
        sort_order: sectionSortOrder,
      })
      .select()
      .single()

    if (sectionError) {
      console.error(`Error inserting section "${sectionTitle}":`, sectionError.message)
      continue // Skip to next section
    }
    const sectionId = sectionData.id
    console.log(`  - Inserted section with ID: ${sectionId}`)

    // Insert items for this section
    const itemsToInsert = formStructure[sectionTitle].map((item, index) => ({
      section_id: sectionId,
      name: item.name,
      item_code: item.code,
      sort_order: index,
    }))

    const { error: itemsError } = await supabase.from("items").insert(itemsToInsert)

    if (itemsError) {
      console.error(`Error inserting items for section "${sectionTitle}":`, itemsError.message)
    } else {
      console.log(`  - Successfully inserted ${itemsToInsert.length} items.`)
    }

    sectionSortOrder++
  }

  console.log("Import completed.")
}

importForm().catch(console.error)
