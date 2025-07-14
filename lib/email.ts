import { Resend } from "resend"
import type { Submission, Brand } from "./types"
import { format } from "date-fns"

const fromEmail = process.env.FROM_EMAIL

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("RESEND_API_KEY environment variable is not set.")
    throw new Error("Server configuration error: RESEND_API_KEY is not set.")
  }
  return new Resend(apiKey)
}

// Centralized function to send a new order email
export async function sendNewOrderEmail({
  submission,
  brand,
  pdfBuffer,
}: {
  submission: Submission
  brand: Brand
  pdfBuffer: Buffer
}) {
  if (!fromEmail) {
    console.error("FROM_EMAIL environment variable is not set.")
    throw new Error("Server configuration error: FROM_EMAIL is not set.")
  }

  const to = [brand.email]
  const cc = submission.email ? [submission.email] : []
  const subject = `New Printing Order: ${submission.order_number} - ${brand.name}`
  const html = generateOrderEmailTemplate(submission, brand)
  const attachments = [
    {
      filename: `${submission.order_number}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ]

  try {
    const resend = getResendClient()
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      cc,
      subject,
      html,
      attachments,
    })
    console.log("Order email sent successfully:", data.id)
    return { success: true, data }
  } catch (error) {
    console.error("Error sending order email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export function generateOrderEmailTemplate(submission: Submission, brand: Brand) {
  const submissionDate = format(new Date(submission.created_at), "dd/MM/yyyy HH:mm")
  const orderedItems = Object.values(submission.items || {}) as any[]

  return `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
<img src="${brand.logo}" alt="${brand.name} Logo" style="max-width: 200px; margin-bottom: 20px; display: block;">
<h2>New Order Received: #${submission.order_number}</h2>
<p>A new order has been placed for <strong>${brand.name}</strong>.</p>
<h3>Order Details:</h3>
<ul style="list-style: none; padding: 0;">
  <li><strong>Order Number:</strong> ${submission.order_number}</li>
  <li><strong>Date Submitted:</strong> ${submissionDate}</li>
  <li><strong>Ordered By:</strong> ${submission.ordered_by}</li>
  <li><strong>Email:</strong> ${submission.email}</li>
  <li><strong>Bill to Clinic:</strong> ${submission.bill_to}</li>
  <li><strong>Deliver to Clinic:</strong><br><pre style="font-family: sans-serif; margin: 0;">${submission.deliver_to}</pre></li>
</ul>
<h3>Items Ordered:</h3>
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Code</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
    </tr>
  </thead>
  <tbody>
    ${orderedItems
      .map(
        (item) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.code}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity === "other" ? item.customQuantity || "N/A" : item.quantity}</td>
      </tr>
    `,
      )
      .join("")}
  </tbody>
</table>
</div>
`
}

export async function sendOrderCompletionEmail(submission: Submission) {
  if (!fromEmail) {
    console.error("FROM_EMAIL environment variable is not set.")
    throw new Error("Server configuration error: FROM_EMAIL is not set.")
  }

  const to = [submission.email]
  const subject = `Your order #${submission.order_number} has been dispatched!`
  const html = generateOrderCompletionEmailTemplate(submission)

  try {
    const resend = getResendClient()
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })
    console.log("Completion email sent successfully:", data.id)
    return data
  } catch (error) {
    console.error("Error sending completion email:", error)
    throw error
  }
}

export function generateOrderCompletionEmailTemplate(submission: Submission) {
  const completionDate = submission.completed_at ? format(new Date(submission.completed_at), "dd/MM/yyyy") : "N/A"
  const expectedDeliveryDate = submission.expected_delivery_date
    ? format(new Date(submission.expected_delivery_date), "dd/MM/yyyy")
    : "Not specified"
  const brandName = submission.brand_name || "Your Brand"

  return `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
<h2>Order #${submission.order_number} Dispatched!</h2>
<p>Hello ${submission.ordered_by},</p>
<p>Great news! Your order for <strong>${brandName}</strong> has been completed and dispatched on ${completionDate}.</p>
<h3>Dispatch Details:</h3>
<ul>
  <li><strong>Expected Delivery Date:</strong> ${expectedDeliveryDate}</li>
</ul>
${
  submission.delivery_details
    ? `<h3>Delivery Notes:</h3><p style="white-space: pre-wrap;">${submission.delivery_details}</p>`
    : ""
}
<p>Thank you for your order!</p>
</div>
`
}
