import nodemailer from "nodemailer"
import type { Brand, OrderInfo, OrderItem } from "@/lib/types"

interface EmailPayload {
  orderInfo: OrderInfo
  items: OrderItem[]
  brand: Brand
  pdfBuffer: Buffer
}

export async function sendOrderEmail(payload: EmailPayload): Promise<void> {
  const { orderInfo, items, brand, pdfBuffer } = payload

  // Create transporter using Mailgun SMTP
  const transporter = nodemailer.createTransporter({
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILGUN_SMTP_USERNAME,
      pass: process.env.MAILGUN_SMTP_PASSWORD,
    },
  })

  // Create email content
  const itemsList = items
    .map((item) => `• ${item.name} ${item.code ? `(${item.code})` : ""} - Quantity: ${item.quantity}`)
    .join("\n")

  const emailText = `
New Order Received

Order Details:
- Order Number: ${orderInfo.orderNumber}
- Ordered By: ${orderInfo.orderedBy}
- Email: ${orderInfo.email}
- Brand: ${brand.name}

Delivery Information:
${orderInfo.deliverTo?.name}
${orderInfo.deliverTo?.address}

Billing Information:
${orderInfo.billTo?.name}
${orderInfo.billTo?.address}

Items Ordered:
${itemsList}

${orderInfo.notes ? `Notes: ${orderInfo.notes}` : ""}

Please find the detailed order form attached as a PDF.
  `

  const emailHtml = `
    <h2>New Order Received</h2>
    
    <h3>Order Details:</h3>
    <ul>
      <li><strong>Order Number:</strong> ${orderInfo.orderNumber}</li>
      <li><strong>Ordered By:</strong> ${orderInfo.orderedBy}</li>
      <li><strong>Email:</strong> ${orderInfo.email}</li>
      <li><strong>Brand:</strong> ${brand.name}</li>
    </ul>

    <h3>Delivery Information:</h3>
    <p>
      ${orderInfo.deliverTo?.name}<br>
      ${orderInfo.deliverTo?.address}
    </p>

    <h3>Billing Information:</h3>
    <p>
      ${orderInfo.billTo?.name}<br>
      ${orderInfo.billTo?.address}
    </p>

    <h3>Items Ordered:</h3>
    <ul>
      ${items.map((item) => `<li>${item.name} ${item.code ? `(${item.code})` : ""} - Quantity: ${item.quantity}</li>`).join("")}
    </ul>

    ${orderInfo.notes ? `<h3>Notes:</h3><p>${orderInfo.notes}</p>` : ""}

    <p>Please find the detailed order form attached as a PDF.</p>
  `

  // Send email
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: process.env.FROM_EMAIL, // Send to yourself
    cc: orderInfo.email, // CC the customer
    subject: `New Order: ${orderInfo.orderNumber} - ${brand.name}`,
    text: emailText,
    html: emailHtml,
    attachments: [
      {
        filename: `order-${orderInfo.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  })
}
