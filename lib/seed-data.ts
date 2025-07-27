import { createClient } from "./supabase/server"

export const seedData = [
  {
    name: "Vision Radiology",
    slug: "vision-radiology",
    logo_url: "/vision-radiology-logo.svg",
    primary_color: "#1e40af",
    secondary_color: "#ffffff",
    recipient_email: "orders@visionradiology.com.au",
    is_active: true,
    clinics: [{ name: "Main Clinic", address: "123 Vision St, Melbourne" }],
    sections: [
      {
        title: "OPERATIONAL AND PATIENT BROCHURES",
        sort_order: 0,
        items: [
          {
            code: "VR-LAB",
            name: "LABELS",
            description: "1000 per box (A5 generic)",
            quantities: ["6 boxes", "10 boxes", "16 boxes", "other"],
            sort_order: 0,
          },
          {
            code: "VR-LH",
            name: "LETTERHEAD",
            description: "1000 per box (site specific)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 1,
          },
        ],
      },
    ],
  },
  {
    name: "Light Radiology",
    slug: "light-radiology",
    logo_url: "/light-radiology-logo.svg",
    primary_color: "#059669",
    secondary_color: "#ffffff",
    recipient_email: "orders@lightradiology.com.au",
    is_active: true,
    clinics: [{ name: "Sunshine Clinic", address: "456 Light Ave, Brisbane" }],
    sections: [],
  },
  {
    name: "Focus Radiology",
    slug: "focus-radiology",
    logo_url: "/images/focus-radiology-logo.png",
    primary_color: "#dc2626",
    secondary_color: "#ffffff",
    recipient_email: "orders@focusradiology.com.au",
    is_active: true,
    clinics: [{ name: "City Imaging", address: "789 Focus Rd, Sydney" }],
    sections: [],
  },
  {
    name: "Quantum Medical Imaging",
    slug: "quantum-medical-imaging",
    logo_url:
      "https://www.jotform.com/uploads/Germon/form_files/Quantum-Imaging-Logo.67ce57124c7890.77397803-removebg-preview.67d52f7359e367.05025068.png",
    primary_color: "#2a3760",
    secondary_color: "#ffffff",
    recipient_email: "orders@quantummedical.com.au",
    is_active: true,
    clinics: [{ name: "Quantum HQ", address: "101 Quantum Blvd, Perth" }],
    sections: [
      {
        title: "REFERRALS",
        sort_order: 1,
        items: [
          {
            code: "QMI-A4REF",
            name: "A4 REFERRAL (with wrapping)",
            description: "20 packs of 100 per box (with wrapping)",
            quantities: ["3 boxes", "6 boxes", "9 boxes", "other"],
            sort_order: 0,
          },
        ],
      },
    ],
  },
]

export async function seedDatabase() {
  const supabase = createClient()

  console.log("--- Clearing existing data ---")
  await supabase.from("items").delete().neq("id", 0)
  await supabase.from("sections").delete().neq("id", 0)
  await supabase.from("brands").delete().neq("id", 0)
  console.log("--- Data cleared ---")

  console.log("--- Seeding new data ---")
  for (const brand of seedData) {
    const { sections, ...brandData } = brand
    const { data: newBrand, error: brandError } = await supabase.from("brands").insert(brandData).select().single()

    if (brandError) throw brandError

    for (const section of sections) {
      const { items, ...sectionData } = section
      const { data: newSection, error: sectionError } = await supabase
        .from("sections")
        .insert({ ...sectionData, brand_id: newBrand.id })
        .select()
        .single()

      if (sectionError) throw sectionError

      const itemsToInsert = items.map((item) => ({
        ...item,
        section_id: newSection.id,
        brand_id: newBrand.id,
      }))

      const { error: itemsError } = await supabase.from("items").insert(itemsToInsert)

      if (itemsError) throw itemsError
    }
  }
  console.log("--- Seeding complete ---")
}
