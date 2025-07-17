import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_NEON_DATABASE_URL)

async function testConnection() {
  console.log("🔍 Testing Neon Database Connection...")
  console.log("Database URL exists:", !!process.env.NEON_DATABASE_URL)

  try {
    // Test basic connection
    console.log("\n1. Testing basic connection...")
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`
    console.log("✅ Connection successful!")
    console.log("Current time:", result[0].current_time)
    console.log("PostgreSQL version:", result[0].pg_version)

    // Test brands table
    console.log("\n2. Testing brands table...")
    const brands = await sql`SELECT id, name, slug FROM brands LIMIT 5`
    console.log("✅ Brands found:", brands.length)
    brands.forEach((brand) => {
      console.log(`  - ${brand.name} (${brand.slug})`)
    })

    // Test clinic_locations table
    console.log("\n3. Testing clinic_locations table...")
    const locations = await sql`SELECT id, name, address, brand_id FROM clinic_locations LIMIT 10`
    console.log("✅ Clinic locations found:", locations.length)
    locations.forEach((location) => {
      console.log(
        `  - ID: ${location.id}, Name: ${location.name}, Address: ${location.address}, Brand: ${location.brand_id}`,
      )
      console.log(`    Name type: ${typeof location.name}, Address type: ${typeof location.address}`)
    })

    // Test sections table
    console.log("\n4. Testing sections table...")
    const sections = await sql`SELECT id, title, brand_id FROM sections LIMIT 5`
    console.log("✅ Sections found:", sections.length)
    sections.forEach((section) => {
      console.log(`  - ${section.title} (Brand: ${section.brand_id})`)
    })

    // Test form_fields table
    console.log("\n5. Testing form_fields table...")
    const fields = await sql`SELECT id, label, field_type, section_id FROM form_fields LIMIT 10`
    console.log("✅ Form fields found:", fields.length)
    fields.forEach((field) => {
      console.log(`  - ${field.label} (${field.field_type}) - Section: ${field.section_id}`)
    })

    // Test field_options table
    console.log("\n6. Testing field_options table...")
    const options = await sql`SELECT id, label, value, field_id FROM field_options LIMIT 10`
    console.log("✅ Field options found:", options.length)
    options.forEach((option) => {
      console.log(`  - Label: ${option.label}, Value: ${option.value}, Field: ${option.field_id}`)
      console.log(`    Label type: ${typeof option.label}, Value type: ${typeof option.value}`)
    })

    // Test specific query that might be causing issues
    console.log("\n7. Testing specific brand query (focus-radiology)...")
    const brandData = await sql`
      SELECT 
        b.id as brand_id,
        b.name as brand_name,
        b.slug as brand_slug,
        cl.id as location_id,
        cl.name as location_name,
        cl.address as location_address
      FROM brands b
      LEFT JOIN clinic_locations cl ON b.id = cl.brand_id
      WHERE b.slug = 'focus-radiology'
      LIMIT 5
    `
    console.log("✅ Brand with locations:", brandData.length)
    brandData.forEach((row) => {
      console.log(`  - Brand: ${row.brand_name}`)
      console.log(`  - Location: ${row.location_name} (${row.location_address})`)
      console.log(`  - Types: name=${typeof row.location_name}, address=${typeof row.location_address}`)
    })

    // Test the exact query used in the form
    console.log("\n8. Testing form data query...")
    const formData = await sql`
      SELECT 
        b.id,
        b.name,
        b.slug,
        b.logo_url,
        json_agg(
          json_build_object(
            'id', cl.id,
            'name', cl.name,
            'address', cl.address
          ) ORDER BY cl.name
        ) FILTER (WHERE cl.id IS NOT NULL) as clinic_locations,
        json_agg(
          json_build_object(
            'id', s.id,
            'title', s.title,
            'order_index', s.order_index,
            'fields', s.fields
          ) ORDER BY s.order_index
        ) FILTER (WHERE s.id IS NOT NULL) as sections
      FROM brands b
      LEFT JOIN clinic_locations cl ON b.id = cl.brand_id
      LEFT JOIN sections s ON b.id = s.brand_id
      WHERE b.slug = 'focus-radiology'
      GROUP BY b.id, b.name, b.slug, b.logo_url
    `

    console.log("✅ Form data query result:", formData.length)
    if (formData.length > 0) {
      const brand = formData[0]
      console.log(`  - Brand: ${brand.name}`)
      console.log(`  - Clinic locations:`, brand.clinic_locations)
      console.log(`  - Sections count:`, brand.sections?.length || 0)

      if (brand.clinic_locations) {
        brand.clinic_locations.forEach((loc, index) => {
          console.log(`    Location ${index + 1}:`, loc)
          console.log(`    Name type: ${typeof loc.name}, Address type: ${typeof loc.address}`)
        })
      }
    }

    console.log("\n✅ All tests completed successfully!")
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    })
  }
}

testConnection()
