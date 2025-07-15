import nodemailer from "nodemailer"
import type { Submission, Brand } from "./types"
import { format } from "date-fns"

const fromEmail = process.env.FROM_EMAIL

const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.MAILGUN_SMTP_USERNAME,
    pass: process.env.MAILGUN_SMTP_PASSWORD,
  },
})

export async function sendNewOrderEmail({
  submission,
  brand,
  pdfBuffer,
}: {
  submission: Submission
  brand: Brand
  pdfBuffer: Buffer
}) {
  console.log("Preparing to send new order email...")
  if (!fromEmail) {
    const errorMsg = "Server configuration error: FROM_EMAIL is not set."
    console.error(`sendNewOrderEmail: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
  if (!process.env.MAILGUN_SMTP_USERNAME || !process.env.MAILGUN_SMTP_PASSWORD) {
    const errorMsg = "Server configuration error: Mailgun SMTP credentials are not set."
    console.error(`sendNewOrderEmail: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }

  const mailOptions = {
    from: `Crowd IT Print Ordering <${fromEmail}>`,
    to: brand.email,
    cc: submission.email ? submission.email : undefined,
    subject: `New Printing Order: ${submission.order_number} - ${brand.name}`,
    html: generateOrderEmailTemplate(submission, brand),
    attachments: [
      {
        filename: `${submission.order_number}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  }

  try {
    console.log(
      `Sending new order email to ${brand.email} (CC: ${submission.email}) for order ${submission.order_number}`,
    )
    const info = await transporter.sendMail(mailOptions)
    console.log("Order email sent successfully:", info.messageId, "Response:", info.response)
    return { success: true, data: info }
  } catch (error) {
    console.error(`Error sending order email for ${submission.order_number}:`, error)
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
      (item: any) => `
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

export async function sendOrderCompletionEmail(submission: Submission & { brand?: Brand }) {
  console.log("sendOrderCompletionEmail called with submission data:", JSON.stringify(submission, null, 2))

  if (!fromEmail) {
    const errorMsg = "Server configuration error: FROM_EMAIL is not set."
    console.error(`sendOrderCompletionEmail: ${errorMsg}`)
    throw new Error(errorMsg)
  }
  if (!process.env.MAILGUN_SMTP_USERNAME || !process.env.MAILGUN_SMTP_PASSWORD) {
    const errorMsg = "Server configuration error: Mailgun SMTP credentials are not set."
    console.error(`sendOrderCompletionEmail: ${errorMsg}`)
    throw new Error(errorMsg)
  }
  if (!submission.email) {
    console.warn(
      `sendOrderCompletionEmail: No email address found for submission ${submission.id}. Cannot send completion email.`,
    )
    return
  }

  const mailOptions = {
    from: `Crowd IT Print Ordering <${fromEmail}>`,
    to: submission.email,
    subject: `Your order #${submission.order_number} has been dispatched!`,
    html: generateOrderCompletionEmailTemplate(submission),
  }

  try {
    console.log(`Attempting to send completion email to: ${submission.email} for order ${submission.order_number}`)
    const info = await transporter.sendMail(mailOptions)
    console.log("Completion email sent successfully:", info.messageId, "Response:", info.response)
    return info
  } catch (error) {
    console.error(`Error sending completion email for order ${submission.order_number}:`, error)
    throw error
  }
}

export function generateOrderCompletionEmailTemplate(submission: Submission & { brand?: Brand }) {
  const completionDate = submission.completed_at ? format(new Date(submission.completed_at), "dd/MM/yyyy") : "N/A"
  const brandName = submission.brand?.name || submission.brand_name || "Your Brand"

  return `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
<h2>Order #${submission.order_number} Dispatched!</h2>
<p>Hello ${submission.ordered_by},</p>
<p>Great news! Your order for <strong>${brandName}</strong> has been completed and dispatched on ${completionDate}.</p>
<h3>Dispatch Details:</h3>
<ul>
<li><strong>Courier:</strong> ${submission.completion_courier || "N/A"}</li>
<li><strong>Tracking Number:</strong> ${submission.completion_tracking || "N/A"}</li>
<li><strong>Notes:</strong> ${submission.completion_notes || "None"}</li>
</ul>
<p>Thank you for your order!</p>
</div>
`
}
