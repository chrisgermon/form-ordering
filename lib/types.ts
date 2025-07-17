// A completely safe, flat structure to pass to the client
export interface ClientFormProps {
  brand: {
    slug: string
    name: string
    logo: string | null
  }
  locations: {
    value: string
    label: string
  }[]
  sections: {
    id: string
    title: string
    items: {
      id: string
      name: string
      code: string | null
      fieldType: string
    }[]
  }[]
}

// The data structure for the form submission using React Hook Form
export interface FormValues {
  orderedBy: string
  email: string
  billToId: string
  deliverToId: string
  notes?: string
  items: Record<string, string | number | boolean>
}

// The payload for our server action
export interface ActionPayload {
  brandSlug: string
  formData: FormValues
}

// Types for generating the PDF, requires full objects
export interface OrderInfoForPdf {
  orderNumber: string
  orderedBy: string
  email: string
  notes?: string
  billTo: { name: string; address: string }
  deliverTo: { name: string; address: string }
}

export interface PdfOrderItem {
  name: string
  code: string | null
  quantity: string | number | boolean
}
