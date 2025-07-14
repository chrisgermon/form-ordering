import { createServerSupabaseClient } from "./supabase"

export default async function seedDatabase() {
  const supabase = createServerSupabaseClient()

  // Create brands
  const brands = [
    {
      name: "Vision Radiology",
      slug: "vision-radiology",
      logo: "/vision-radiology-logo.svg",
      active: true,
      primary_color: "#1e40af",
      email: "orders@visionradiology.com.au",
    },
    {
      name: "Light Radiology",
      slug: "light-radiology",
      logo: "/light-radiology-logo.svg",
      active: true,
      primary_color: "#059669",
      email: "orders@lightradiology.com.au",
    },
    {
      name: "Focus Radiology",
      slug: "focus-radiology",
      logo: "/images/focus-radiology-logo.png",
      active: true,
      primary_color: "#dc2626",
      email: "orders@focusradiology.com.au",
    },
    {
      name: "Quantum Medical Imaging",
      slug: "quantum-medical-imaging",
      logo: "https://www.jotform.com/uploads/Germon/form_files/Quantum-Imaging-Logo.67ce57124c7890.77397803-removebg-preview.67d52f7359e367.05025068.png",
      active: true,
      primary_color: "#2a3760",
      email: "orders@quantummedical.com.au",
    },
  ]

  for (const brand of brands) {
    const { error } = await supabase.from("brands").upsert(brand, { onConflict: "slug" })
    if (error) {
      console.error(`Error seeding brand ${brand.name}:`, error)
    } else {
      console.log(`✅ Seeded brand: ${brand.name}`)
    }
  }

  const { data: brandData } = await supabase.from("brands").select("id, slug")
  if (!brandData) {
    console.error("Could not fetch brand data after seeding.")
    return
  }
  const brandMap = brandData.reduce((acc, brand) => ({ ...acc, [brand.slug]: brand.id }), {} as Record<string, string>)

  // --- SEED VISION RADIOLOGY (RESTORATION) ---
  if (brandMap["vision-radiology"]) {
    const brand_id = brandMap["vision-radiology"]
    console.log(`Restoring form data for Vision Radiology (brand_id: ${brand_id})...`)
    await supabase.from("product_items").delete().eq("brand_id", brand_id)
    await supabase.from("product_sections").delete().eq("brand_id", brand_id)

    const visionFormData = [
      {
        section: { title: "OPERATIONAL AND PATIENT BROCHURES", sort_order: 0 },
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
          {
            code: "VR-AC",
            name: "APPOINTMENT CARDS",
            description: "250 per box (site specific)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 2,
          },
          {
            code: "VR-DLSS",
            name: "DL PLAIN ENVELOPES",
            description: "500 per box (generic PO Box)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 3,
          },
          {
            code: "VR-DLSS-WF",
            name: "DL WINDOW FACED ENVELOPES",
            description: "500 per box (generic PO Box)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 4,
          },
          {
            code: "VR-C5SS",
            name: "C5 ENVELOPES",
            description: "500 per box (generic PO Box)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 5,
          },
          {
            code: "VR-C4SS",
            name: "C4 ENVELOPES",
            description: "250 per box (generic)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 6,
          },
          {
            code: "VR-FILM-L",
            name: "FILM BAGS/ENVELOPES LARGE",
            description: "250 per box (generic)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 7,
          },
          {
            code: "VR-FILM-S",
            name: "FILM BAGS/ENVELOPES SMALL",
            description: "250 per box (generic)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 8,
          },
          {
            code: "VR-GR",
            name: "GENDER REVEAL CARDS + ENVELOPES",
            description: "Separate Boy + Girl cards",
            quantities: ["50", "100", "200", "other"],
            sort_order: 9,
          },
        ],
      },
      {
        section: { title: "IMAGE MANAGEMENT", sort_order: 1 },
        items: [
          {
            code: "VR-CD",
            name: "CDs",
            description: "100 per spindle (generic)",
            quantities: ["1 spindle", "2 spindles", "4 spindles", "other"],
            sort_order: 0,
          },
          {
            code: "VR-DVD",
            name: "DVDs",
            description: "100 per spindle (generic)",
            quantities: ["1 spindle", "2 spindles", "4 spindles", "other"],
            sort_order: 1,
          },
          {
            code: "VR-SLEV",
            name: "CD/DVD SLEEVES",
            description: "100 per pack (generic)",
            quantities: ["1 pack", "2 packs", "4 packs", "other"],
            sort_order: 2,
          },
        ],
      },
      {
        section: { title: "REFERRALS", sort_order: 2 },
        items: [
          {
            code: "VR-A4GEN",
            name: "A4 GENERAL",
            description: "20 packs of 50 per box (generic)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 0,
          },
          {
            code: "VR-A4GENMRI",
            name: "A4 GENERAL - GP MRI Tick Boxes",
            description: "20 packs of 50 per box (generic)",
            quantities: ["6 boxes", "8 boxes", "12 boxes", "other"],
            sort_order: 1,
          },
          {
            code: "VR-A4CC1",
            name: "A4 CARDIAC",
            description: "20 packs of 50 per box (generic)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sort_order: 2,
          },
          {
            code: "VR-A4MRIS",
            name: "A4 SPECIALIST MRI",
            description: "20 packs of 50 per box (generic)",
            quantities: ["6 boxes", "8 boxes", "12 boxes", "other"],
            sort_order: 3,
          },
          {
            code: "VR-A5GEN1",
            name: "A5 GENERAL",
            description: "40 pads of 50 per box (generic)",
            quantities: ["1 box", "2 boxes", "3 boxes", "other"],
            sort_order: 4,
          },
          {
            code: "VR-A5CHIRO1",
            name: "A5 CHIROPRACTIC",
            description: "40 pads of 50 per box (generic)",
            quantities: ["1 box", "2 boxes", "3 boxes", "other"],
            sort_order: 5,
          },
          {
            code: "VR-A5DENTAL1",
            name: "A5 DENTAL",
            description: "40 pads of 50 per box (generic)",
            quantities: ["1 box", "2 boxes", "3 boxes", "other"],
            sort_order: 6,
          },
        ],
      },
    ]

    for (const { section, items } of visionFormData) {
      const { data: newSection, error: sectionError } = await supabase
        .from("product_sections")
        .insert({ ...section, brand_id })
        .select("id")
        .single()
      if (sectionError || !newSection) {
        console.error(`Error restoring section "${section.title}":`, sectionError)
        continue
      }
      const itemsToInsert = items.map((item) => ({ ...item, section_id: newSection.id, brand_id }))
      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from("product_items").insert(itemsToInsert)
        if (itemsError) {
          console.error(`Error restoring items for section "${section.title}":`, itemsError)
        }
      }
    }
    console.log("✅ Restored Vision Radiology form data.")
  }

  // --- SEED QUANTUM MEDICAL IMAGING ---
  if (brandMap["quantum-medical-imaging"]) {
    const brand_id = brandMap["quantum-medical-imaging"]
    console.log(`Seeding form for Quantum Medical Imaging (brand_id: ${brand_id})...`)
    await supabase.from("product_items").delete().eq("brand_id", brand_id)
    await supabase.from("product_sections").delete().eq("brand_id", brand_id)

    const quantumFormData = [
      {
        section: { title: "OPERATIONAL AND PATIENT BROCHURES", sort_order: 0 },
        items: [
          {
            code: "QMI-A5LAB",
            name: "LABELS",
            description: "1000 per box",
            quantities: ["6 boxes", "10 boxes", "16 boxes", "other"],
            sort_order: 0,
          },
          {
            code: "QMI-A4LET",
            name: "LETTERHEAD",
            description: "2000 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1NpggzaiF91bnME-pNAtQp_L3yX4XETxe",
            sort_order: 1,
          },
          {
            code: "QMI-AC",
            name: "APPOINTMENT CARDS",
            description: "250 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=16CRW1U0qo0_MR6BWg84M-nOuwsPtU8B6",
            sort_order: 2,
          },
          {
            code: "QMI-GOOGLE",
            name: "GOOGLE REVIEW CARD",
            description: "500 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1EgXfLfjYSFfuzM4GXL4X-oAZ1QVyvKap",
            sort_order: 3,
          },
          {
            code: "QMI-STIC",
            name: "STICKER",
            description: "500 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1IowFcx_ZPJiHEqUNdPLA-exrWeBld7f4",
            sort_order: 4,
          },
          {
            code: "QMI-GOOGLE-Q",
            name: "QUANTUM FACEBOOK REVIEW",
            description: "500 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=12j8VHYdivJTXfXue6cqnm2W1oG77cGzH",
            sort_order: 5,
          },
          {
            code: "QMI-FILMS-L",
            name: "FILM BAGS/ENVELOPES LARGE",
            description: "250 per box",
            quantities: ["4 boxes", "6 boxes", "8 boxes", "other"],
            sort_order: 6,
          },
          {
            code: "QMI-FILMS-S",
            name: "FILM BAGS/ENVELOPES SMALL",
            description: "250 per box",
            quantities: ["4 boxes", "6 boxes", "8 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1Qrlee5uRe59gYQOJ_OO9zFjbchZHqn1g",
            sort_order: 7,
          },
          {
            code: "QMI-IRAC",
            name: "PACS APPOINTMENT CARD",
            description: "500 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1Ewesc4VLwyzbqxNVeG46XkaaJQJWot8W",
            sort_order: 8,
          },
          {
            code: "QMI-LSAC",
            name: "LEIGH BUSINESS CARDS",
            description: "250 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=16pvH0kcVO-cToqZLDb4A3vQKN7QLFx9z",
            sort_order: 9,
          },
          {
            code: "QMI-US",
            name: "ULTRASOUND APPOINTMENT CARDS",
            description: "250 per box",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1Al8lejShxQVRX5wJ8jVqU-_NdUmOrUZm",
            sort_order: 10,
          },
        ],
      },
      {
        section: { title: "REFERRALS", sort_order: 1 },
        items: [
          {
            code: "QMI-A4REF",
            name: "A4 REFERRAL (with wrapping)",
            description: "20 packs of 100 per box (with wrapping)",
            quantities: ["3 boxes", "6 boxes", "9 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1-PX8ydK01xFsdJukMNAa2EEJmzR7Iul6",
            sort_order: 0,
          },
          {
            code: "QMI-A4REF-BULK",
            name: "A4 REFERRAL (without wrapping)",
            description: "2000 per box (without wrapping)",
            quantities: ["3 boxes", "6 boxes", "9 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1-PX8ydK01xFsdJukMNAa2EEJmzR7Iul6",
            sort_order: 1,
          },
          {
            code: "QMI-A4CC1",
            name: "A4 CARDIAC (with wrapping)",
            description: "20 packs of 100 per box (with wrapping)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1gMVNCrCrXFNi116swuqkjEmbaxc2NaTz",
            sort_order: 2,
          },
          {
            code: "QMI-A4CC1-BULK",
            name: "A4 CARDIAC (without wrapping)",
            description: "2000 per box (without wrapping)",
            quantities: ["1 box", "2 boxes", "4 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1gMVNCrCrXFNi116swuqkjEmbaxc2NaTz",
            sort_order: 3,
          },
          {
            code: "QMI-A5GEN",
            name: "A5 SPECIALIST",
            description: "40 pads of 50 per box",
            quantities: ["1 box", "2 boxes", "3 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1J9a3GmGvH6oy-1HtN9N0YBOj3CvTWqsp",
            sort_order: 4,
          },
          {
            code: "QMI-A5DENTAL",
            name: "A5 DENTAL",
            description: "40 pads of 50 per box",
            quantities: ["1 box", "2 boxes", "3 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1dJfUBdYkxFtvLV5F6md2SGZDGvY-hTav",
            sort_order: 5,
          },
          {
            code: "QMI-A5ALLIED",
            name: "A5 CHIRO PHYSIO",
            description: "40 pads of 50 per box",
            quantities: ["1 box", "2 boxes", "3 boxes", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1wBiSqEpnK6aUMEcHWAr1W-2IiqzMy4ML",
            sort_order: 6,
          },
        ],
      },
      {
        section: { title: "PATIENT BROCHURES", sort_order: 2 },
        items: [
          {
            code: "QMI-SK",
            name: "SHOULDER AND KNEE ULTRASOUND",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1zEqZSV0vDaVv59DtIXKOHSxKVRHVPi73",
            sort_order: 0,
          },
          {
            code: "QMI-PRI",
            name: "PLATELET-RICH PLASMA (PRP) INJECTIONS",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1JmO2142ZpEnabVvKBgngptvzjLyJMNCs",
            sort_order: 1,
          },
          {
            code: "QMI-POD",
            name: "PODIATRISTS",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1gFeTUCDBMcnov02Yq4GYl2kOB_BtQMSc",
            sort_order: 2,
          },
          {
            code: "QMI-PHYS",
            name: "PHYSIOTHERAPY AND OSTEOPATHY",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1xclh5z-s6VLqkt-sbmJv3iM1HDt_KLR8",
            sort_order: 3,
          },
          {
            code: "QMI-HAINJ",
            name: "HYALURONIC ACID JOINT INJECTIONS",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1uZ3GePI1uYPKaTI4mnjY796rZARfnuuo",
            sort_order: 4,
          },
          {
            code: "QMI-HAEUF",
            name: "INTRA-ARTICULAR HYALURONIC ACID INJECTION",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1PyqjQar48Jc2j4dENUNrYzuiTFP9DDSb",
            sort_order: 5,
          },
          {
            code: "QMI-ELASTO",
            name: "ELASTOGRAPHY",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1pYDGEOUNbcBzCOuCIn1dyFxLWfLPZMs4",
            sort_order: 6,
          },
          {
            code: "QMI-DRINFO",
            name: "RADIOLOGIST PROFILE",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1lTsVPd2Kv9tfMooZJPREt2Blr_OWEJMr",
            sort_order: 7,
          },
          {
            code: "QMI-CTCAF",
            name: "CT CORONARY ANGIOGRAPHY",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1oBJEGwvaj5-XXOhYW3NC2M7KsxKxJbjY",
            sort_order: 8,
          },
          {
            code: "QMI-CHIRO",
            name: "CHIROPRACTORS",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=16qbpjSP0e1-4F-2nhtOtRwzQGMlKrMhQ",
            sort_order: 9,
          },
          {
            code: "QMI-BMD",
            name: "BONE MINERAL DENSITOMETRY",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1QOn4-fsC0ovww9yeasYBr_24SmHXaeEF",
            sort_order: 10,
          },
          {
            code: "QMI-ANG",
            name: "CT ANGIOGRAPHY",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1TvFX7pz_q9dr9hgt25DF6-u0p5CDKr5d",
            sort_order: 11,
          },
          {
            code: "QMI-HAA",
            name: "HYALURONIC ACID INJECTIONS - A4 Double Sided",
            description: "Patient brochure",
            quantities: ["100", "200", "300", "other"],
            sample_link: "https://drive.google.com/uc?export=download&id=1wvmY26GdBKJIiTgrtwi9p-OGT3HrlNuG",
            sort_order: 12,
          },
        ],
      },
    ]

    for (const { section, items } of quantumFormData) {
      const { data: newSection, error: sectionError } = await supabase
        .from("product_sections")
        .insert({ ...section, brand_id })
        .select("id")
        .single()
      if (sectionError || !newSection) {
        console.error(`Error seeding section "${section.title}":`, sectionError)
        continue
      }
      const itemsToInsert = items.map((item) => ({ ...item, section_id: newSection.id, brand_id }))
      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from("product_items").insert(itemsToInsert)
        if (itemsError) {
          console.error(`Error seeding items for section "${section.title}":`, itemsError)
        }
      }
    }
    console.log("✅ Seeded Quantum Medical Imaging form data.")
  }

  console.log("🎉 Database seeding completed!")
}
