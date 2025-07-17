import { createClient } from "@/utils/supabase/server"

export async function generatePDF(submissionId: string): Promise<Buffer> {
  console.log("=== GENERATE PDF START ===")
  console.log("Submission ID:", submissionId)

  try {
    const supabase = createClient()

    // Get submission with related data
    const { data: submission, error: submissionError } = await supabase
      .from("order_submissions")
      .select(`
        *,
        brand:brands(*),
        deliver_to:clinic_locations!deliver_to_id(*),
        bill_to:clinic_locations!bill_to_id(*),
        items:order_items(
          *,
          item:form_items(*)
        )
      `)
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      console.error("Failed to fetch submission:", submissionError)
      throw new Error("Submission not found")
    }

    console.log("Submission data fetched:", {
      id: submission.id,
      brand: submission.brand?.name,
      itemsCount: submission.items?.length || 0,
    })

    // Create a simple PDF content string
    const pdfContent = `
ORDER FORM - ${String(submission.brand?.name || "Unknown Brand")}

Order ID: ${String(submission.id)}
Ordered By: ${String(submission.ordered_by)}
Email: ${String(submission.email)}
Date: ${new Date(submission.created_at).toLocaleDateString()}

Deliver To: ${String(submission.deliver_to?.name || "Unknown")} - ${String(submission.deliver_to?.address || "")}
Bill To: ${String(submission.bill_to?.name || "Unknown")} - ${String(submission.bill_to?.address || "")}

Items:
${(submission.items || [])
  .map((orderItem: any) => `- ${String(orderItem.item?.name || "Unknown Item")} (Qty: ${orderItem.quantity})`)
  .join("\n")}

Notes: ${String(submission.notes || "None")}
    `.trim()

    console.log("PDF content created")

    // For now, return the content as a buffer
    // In a real implementation, you'd use a PDF library like puppeteer or jsPDF
    const buffer = Buffer.from(pdfContent, "utf-8")

    console.log("=== GENERATE PDF SUCCESS ===")
    return buffer
  } catch (error) {
    console.error("=== GENERATE PDF ERROR ===", error)
    throw error
  }
}
