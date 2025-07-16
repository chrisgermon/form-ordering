"use client"

import FormEditor from "./form-editor"

interface Params {
  brandSlug: string
}

interface Props {
  params: Params
}

export default function Editor({ params }: Props) {
  const { brandSlug } = params

  return (
    <div>
      <h1>Editor for {brandSlug}</h1>
      <FormEditor brandSlug={brandSlug} />
    </div>
  )
}
