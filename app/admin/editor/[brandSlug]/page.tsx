import { FormEditor } from "./form-editor"

type EditorPageProps = {
  params: {
    brandSlug: string
  }
}

export default async function EditorPage({ params }: EditorPageProps) {
  return (
    <main>
      <FormEditor brandSlug={params.brandSlug} />
    </main>
  )
}
