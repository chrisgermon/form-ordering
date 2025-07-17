// Props passed from Server to Client Component. Only primitive types.
export interface SafeFormProps {
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

// The payload for our server action, constructed from FormData
export interface ActionPayload {
  brandSlug: string
  orderedBy: string
  email: string
  billToId: string
  deliverToId: string
  notes: string
  items: Record<string, string> // All item values will be strings from FormData
}
