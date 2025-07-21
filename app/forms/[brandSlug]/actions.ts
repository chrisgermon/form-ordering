"use server"

import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import type { Brand, ActionState } from "@/lib/types"
import { sendSubmissionEmail } from "@/lib/email"
import { generatePdf } from "@/lib/pdf"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const FormSchema = z.object({
  patientName: z.string().min(1, "Patient name is required."),
  patientDob: z.string().min(1, "Patient date of birth is required."),
  referringDoctor: z.string().min(1, "Referring doctor is required."),
  clinicalNotes: z.string().optional(),
})

export async function submitOrder(brand: Brand, prevState: any, formData: FormData): Promise<ActionState> {
  const validatedFields = FormSchema.safeParse({
    patientName: formData.get("patientName"),
    patientDob: formData.get("patientDob"),
    referringDoctor: formData.get("referringDoctor"),
    clinicalNotes: formData.get("clinicalNotes"),
  })

  if (!validatedFields.success) {
    return {
      message: "Validation Error: Please check the required fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { patientName, patientDob, referringDoctor, clinicalNotes } = validatedFields.data

  const supabase = createClient()

  const submissionData = {
    brand_id: brand.id,
    patient_name: patientName,
    patient_dob: patientDob,
    referring_doctor: referringDoctor,
    clinical_notes: clinicalNotes,
    status: "New",
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert(submissionData)
    .select()
    .single()

  if (submissionError) {
    console.error("Error inserting submission:", submissionError)
    return {
      message: `Database Error: Failed to create submission. ${submissionError.message}`,
    }
  }

  const items = brand.sections.flatMap((section) => section.items)
  const submissionItems = items
    .map((item) => {
      const value = formData.get(item.id.toString())
      if (value) {
        return {
          submission_id: submission.id,
          item_id: item.id,
          item_value: value as string,
        }
      }
      return null
    })
    .filter((item): item is { submission_id: string; item_id: string; item_value: string } => item !== null)

  if (submissionItems.length > 0) {
    const { error: itemsError } = await supabase.from("submission_items").insert(submissionItems)

    if (itemsError) {
      console.error("Error inserting submission items:", itemsError)
      await supabase.from("submissions").delete().match({ id: submission.id })
      return {
        message: `Database Error: Failed to save form details. ${itemsError.message}`,
      }
    }
  }

  try {
    const pdfBuffer = await generatePdf(brand, formData)
    await sendSubmissionEmail(brand, formData, pdfBuffer)
  } catch (error) {
    console.error("Error generating PDF or sending email:", error)
  }

  revalidatePath("/admin")
  redirect(`/forms/${brand.slug}/success?id=${submission.id}`)
}
