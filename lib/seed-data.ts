export const seedData = {
  brands: [
    {
      name: "Vision Radiology",
      slug: "vision-radiology",
      logo_url: "/vision-radiology-logo.svg",
      recipient_email: "chris.g@visionradiology.com.au",
      clinics: [
        { name: "Vision Radiology Box Hill", address: "123 Vision St, Box Hill VIC 3128" },
        { name: "Vision Radiology Footscray", address: "456 Vision Ave, Footscray VIC 3011" },
      ],
    },
    {
      name: "Focus Radiology",
      slug: "focus-radiology",
      logo_url: "/focus-radiology-logo.png",
      recipient_email: "jane.doe@focusradiology.com.au",
      clinics: [{ name: "Focus Radiology CBD", address: "789 Focus Rd, Melbourne VIC 3000" }],
    },
  ],
  sections: [
    {
      brand_slug: "vision-radiology",
      title: "A4 Request Pads",
      items: [
        {
          code: "VR-A4-GEN",
          name: "A4 General",
          description: "Standard A4 referral pad for general use.",
          quantities: ["1 pad (50 sheets)", "2 pads (100 sheets)", "3 pads (150 sheets)"],
          sample_link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        },
        {
          code: "VR-A4-CAR",
          name: "A4 Cardiac",
          description: "Specialized A4 pad for cardiac imaging requests.",
          quantities: ["1 pad (50 sheets)", "2 pads (100 sheets)"],
          sample_link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        },
      ],
    },
    {
      brand_slug: "vision-radiology",
      title: "A5 Request Pads",
      items: [
        {
          code: "VR-A5-DENTAL",
          name: "A5 Dental/OPG",
          description: "A5 pad for dental and OPG imaging.",
          quantities: ["1 pad (50 sheets)", "2 pads (100 sheets)"],
          sample_link: null,
        },
      ],
    },
    {
      brand_slug: "focus-radiology",
      title: "General Supplies",
      items: [
        {
          code: "FR-A4-GEN",
          name: "A4 General Request Pad",
          description: "Focus Radiology general A4 referral.",
          quantities: ["1 box (5 pads)", "2 boxes (10 pads)"],
          sample_link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        },
        {
          code: "FR-ENV-C4",
          name: "C4 Envelopes",
          description: "Branded C4 envelopes.",
          quantities: ["1 pack (100)", "2 packs (200)"],
          sample_link: null,
        },
      ],
    },
  ],
}
