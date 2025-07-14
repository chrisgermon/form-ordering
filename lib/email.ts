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

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string[]
  subject: string
  html: string
}) {
  if (!fromEmail) {
    console.error("FROM_EMAIL environment variable is not set.")
    throw new Error("Server configuration error: FROM_EMAIL is not set.")
  }
  try {
    const resend = getResendClient()
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })
    console.log("Email sent successfully:", data.id)
    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export function generateOrderEmailTemplate(submission: Submission, brand: Brand) {
  const submissionDate = format(new Date(submission.created_at), "dd/MM/yyyy HH:mm")
  const clinic = brand.clinics.find((c) => c.name === submission.delivery_location)

  return `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
<img src="${brand.logo_url}" alt="${brand.name} Logo" style="max-width: 200px; margin-bottom: 20px;">
<h2>New Order Received: #${submission.order_number}</h2>
<p>A new order has been placed for <strong>${brand.name}</strong>.</p>
<h3>Order Details:</h3>
<ul>
  <li><strong>Order Number:</strong> ${submission.order_number}</li>
  <li><strong>Date:</strong> ${submissionDate}</li>
  <li><strong>Practice Name:</strong> ${submission.practice_name}</li>
  <li><strong>Contact Name:</strong> ${submission.contact_name}</li>
  <li><strong>Contact Email:</strong> ${submission.email}</li>
  <li><strong>Contact Phone:</strong> ${submission.phone}</li>
  <li><strong>Delivery Location:</strong> ${submission.delivery_location}</li>
  ${clinic?.address ? `<li><strong>Delivery Address:</strong> ${clinic.address}</li>` : ""}
</ul>
<h3>Items Ordered:</h3>
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
    </tr>
  </thead>
  <tbody>
    ${Object.entries(submission.ordered_items)
      .map(
        ([item, quantity]) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${quantity}</td>
      </tr>
    `,
      )
      .join("")}
  </tbody>
</table>
${submission.notes ? `<h3>Notes:</h3><p style="white-space: pre-wrap;">${submission.notes}</p>` : ""}
</div>
`
}

export async function sendOrderCompletionEmail(submission: any) {
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

export function generateOrderCompletionEmailTemplate(submission: any) {
  const completionDate = format(new Date(submission.completed_at), "dd/MM/yyyy")
  const expectedDeliveryDate = submission.expected_delivery_date
    ? format(new Date(submission.expected_delivery_date), "dd/MM/yyyy")
    : "Not specified"

  return `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
<h2>Order #${submission.order_number} Dispatched!</h2>
<p>Hello ${submission.contact_name},</p>
<p>Great news! Your order for <strong>${submission.brand_name}</strong> has been completed and dispatched on ${completionDate}.</p>
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
