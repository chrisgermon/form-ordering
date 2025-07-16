interface ClientFormProps {
  brand: string
}

export function BrandForm({ brand }: ClientFormProps) {
  return (
    <div>
      <h1>Form for {brand}</h1>
      {/* Add your form elements here */}
    </div>
  )
}
