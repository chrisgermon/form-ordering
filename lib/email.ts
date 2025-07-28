import nodemailer from "nodemailer"
import type { Item } from "./types"

interface EmailPayload {
  to: string
  cc?: string
  subject: string
  brandName: string
  orderedBy: string
  email: string
  phone?: string
  billTo: string
  deliverTo: string
  items: { [key: string]: Item }
  specialInstructions?: string
  pdfBuffer: Buffer
  pdfUrl: string
}

export async function sendOrderEmail({
  to,
  cc,
  subject,
  brandName,
  orderedBy,
  email,
  phone,
  billTo,
  deliverTo,
  items,
  specialInstructions,
  pdfBuffer,
  pdfUrl,
}: EmailPayload) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILGUN_SMTP_HOST,
    port: Number.parseInt(process.env.MAILGUN_SMTP_PORT || "587", 10),
    auth: {
      user: process.env.MAILGUN_SMTP_USERNAME,
      pass: process.env.MAILGUN_SMTP_PASSWORD,
    },
  })

  const itemsHtml = Object.values(items)
    .map(
      (item) =>
        `<li><strong>${item.name}</strong> - Quantity: ${
          item.quantity === "other" ? item.customQuantity : item.quantity
        }</li>`,
    )
    .join("")

  const htmlBody = `
    <h1>New Order for ${brandName}</h1>
    <p>A new order has been submitted. Please find the details below.</p>
    <h2>Order Details</h2>
    <ul>
      <li><strong>Ordered By:</strong> ${orderedBy}</li>
      <li><strong>Email:</strong> ${email}</li>
      ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ""}
    </ul>
    <h2>Billing Address</h2>
    <p>${billTo.replace(/\n/g, "<br>")}</p>
    <h2>Delivery Address</h2>
    <p>${deliverTo.replace(/\n/g, "<br>")}</p>
    <h2>Items Ordered</h2>
    <ul>
      ${itemsHtml}
    </ul>
    ${specialInstructions ? `<h2>Special Instructions</h2><p>${specialInstructions.replace(/\n/g, "<br>")}</p>` : ""}
    <p>A PDF copy of this order is attached and can also be downloaded <a href="${pdfUrl}">here</a>.</p>
  `

  try {
    const info = await transporter.sendMail({
      from: `"${brandName} Orders" <${process.env.FROM_EMAIL}>`,
      to: to,
      cc: cc,
      subject: subject,
      html: htmlBody,
      attachments: [
        {
          filename: `order-${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })
    console.log("Message sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    throw new Error("Failed to send order confirmation email.")
  }
}
