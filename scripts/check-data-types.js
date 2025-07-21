import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_NEON_DATABASE_URL)

async function checkDataTypes() {
  console.log("🔍 Checking data types that might cause React errors...")

  try {
    // Check for any non-string values in clinic_locations
    console.log("\n1. Checking clinic_locations data types...")
    const locations = await sql`
      SELECT 
        id,
        name,
        address,
        pg_typeof(name) as name_type,
        pg_typeof(address) as address_type,
        CASE 
          WHEN name IS NULL THEN 'NULL'
          WHEN name = '' THEN 'EMPTY'
          ELSE 'OK'
        END as name_status,
        CASE 
          WHEN address IS NULL THEN 'NULL'
          WHEN address = '' THEN 'EMPTY'
          ELSE 'OK'
        END as address_status
      FROM clinic_locations
      ORDER BY id
    `

    console.log("Clinic locations analysis:")
    locations.forEach((loc) => {
      console.log(`  ID: ${loc.id}`)
      console.log(`    Name: "${loc.name}" (${loc.name_type}) - ${loc.name_status}`)
      console.log(`    Address: "${loc.address}" (${loc.address_type}) - ${loc.address_status}`)
    })

    // Check for any problematic field options
    console.log("\n2. Checking field_options data types...")
    const options = await sql`
      SELECT 
        id,
        label,
        value,
        pg_typeof(label) as label_type,
        pg_typeof(value) as value_type,
        field_id
      FROM field_options
      WHERE field_id IN (
        SELECT id FROM form_fields 
        WHERE field_type = 'select' 
        AND section_id IN (
          SELECT id FROM sections WHERE brand_id = (
            SELECT id FROM brands WHERE slug = 'focus-radiology'
          )
        )
      )
      ORDER BY field_id, id
    `

    console.log("Field options analysis:")
    options.forEach((opt) => {
      console.log(`  ID: ${opt.id}, Field: ${opt.field_id}`)
      console.log(`    Label: "${opt.label}" (${opt.label_type})`)
      console.log(`    Value: "${opt.value}" (${opt.value_type})`)
    })

    // Check for any JSON fields that might have objects
    console.log("\n3. Checking for JSON/object fields...")
    const jsonFields = await sql`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND (data_type = 'json' OR data_type = 'jsonb')
    `

    console.log("JSON/JSONB columns found:")
    jsonFields.forEach((field) => {
      console.log(`  ${field.table_name}.${field.column_name} (${field.data_type})`)
    })

    // Check sections.fields JSON structure
    console.log("\n4. Checking sections.fields JSON structure...")
    const sectionsWithFields = await sql`
      SELECT 
        id,
        title,
        fields,
        pg_typeof(fields) as fields_type
      FROM sections
      WHERE brand_id = (SELECT id FROM brands WHERE slug = 'focus-radiology')
      AND fields IS NOT NULL
    `

    console.log("Sections with fields:")
    sectionsWithFields.forEach((section) => {
      console.log(`  Section: ${section.title}`)
      console.log(`    Fields type: ${section.fields_type}`)
      console.log(`    Fields content:`, JSON.stringify(section.fields, null, 2))
    })
  } catch (error) {
    console.error("❌ Data type check failed:", error)
  }
}

checkDataTypes()
