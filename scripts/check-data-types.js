// Use dotenv to load environment variables from .env file during local development
import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

// Ensure Supabase environment variables are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not set.")
}

// Create a Supabase admin client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
})

async function checkDataTypes() {
  console.log("🔍 Checking data types that might cause React errors using Supabase client...")

  try {
    // 1. Checking clinic_locations data types
    console.log("\n1. Checking clinic_locations data types...")
    const { data: locations, error: locationsError } = await supabase
      .from("clinic_locations")
      .select("id, name, address")
      .order("id")

    if (locationsError) throw locationsError

    console.log("Clinic locations analysis:")
    locations.forEach((loc) => {
      const name_status = loc.name === null ? "NULL" : loc.name === "" ? "EMPTY" : "OK"
      const address_status = loc.address === null ? "NULL" : loc.address === "" ? "EMPTY" : "OK"
      console.log(`  ID: ${loc.id}`)
      console.log(`    Name: "${loc.name}" (type: ${typeof loc.name}) - ${name_status}`)
      console.log(`    Address: "${loc.address}" (type: ${typeof loc.address}) - ${address_status}`)
    })

    // 2. Checking field_options data types for 'focus-radiology'
    console.log("\n2. Checking field_options data types for 'focus-radiology'...")

    // Step 1: Get brand ID
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", "focus-radiology")
      .single()
    if (brandError) throw new Error(`Could not find brand 'focus-radiology': ${brandError.message}`)

    // Step 2: Get section IDs for the brand
    const { data: sections, error: sectionsError } = await supabase
      .from("product_sections")
      .select("id")
      .eq("brand_id", brand.id)
    if (sectionsError) throw sectionsError
    const sectionIds = sections.map((s) => s.id)

    if (sectionIds.length > 0) {
      // Step 3: Get field IDs for those sections
      const { data: fields, error: fieldsError } = await supabase
        .from("product_items")
        .select("id")
        .eq("field_type", "select")
        .in("section_id", sectionIds)
      if (fieldsError) throw fieldsError
      const fieldIds = fields.map((f) => f.id)

      if (fieldIds.length > 0) {
        // Step 4: Get the options for those fields
        const { data: options, error: optionsError } = await supabase
          .from("field_options")
          .select("id, label, value, product_item_id")
          .in("product_item_id", fieldIds)
          .order("product_item_id")
          .order("id")
        if (optionsError) throw optionsError

        console.log("Field options analysis:")
        options.forEach((opt) => {
          console.log(`  ID: ${opt.id}, Field: ${opt.product_item_id}`)
          console.log(`    Label: "${opt.label}" (type: ${typeof opt.label})`)
          console.log(`    Value: "${opt.value}" (type: ${typeof opt.value})`)
        })
      } else {
        console.log("No 'select' type fields found for this brand to check options.")
      }
    } else {
      console.log("No sections found for this brand.")
    }

    console.log("\n3. JSON/object field checks are now handled within application logic.")
    console.log("4. `sections.fields` check is obsolete and has been removed.")
    console.log("\n✅ Data type check complete.")
  } catch (error) {
    console.error("❌ Data type check failed:", error)
  }
}

checkDataTypes()
