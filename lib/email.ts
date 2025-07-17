import nodemailer from "nodemailer"
import type { OrderInfoForPdf, OrderItem } from "./types"

export async function sendOrderEmail(
  orderInfo: OrderInfoForPdf,
  items: OrderItem[],
  pdfBuffer: Buffer,
  recipientEmails: string[],
) {
  try {
    const transporter = nodemailer.createTransporter({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USERNAME,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    })

    const itemsList = items
      .map((item) => `${item.code ? `${item.code} - ` : ""}${item.name}: ${item.quantity}`)
      .join("\n")

    const emailContent = `
New order received:

Order Number: ${orderInfo.orderNumber}
Ordered By: ${orderInfo.orderedBy}
Email: ${orderInfo.email}
Date: ${new Date().toLocaleDateString()}

Bill To:
${orderInfo.billTo.name}
${orderInfo.billTo.address}

Deliver To:
${orderInfo.deliverTo.name}
${orderInfo.deliverTo.address}

Items:
${itemsList}

${orderInfo.notes ? `Notes: ${orderInfo.notes}` : ""}
    `

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: recipientEmails.join(", "),
      subject: `New Order: ${orderInfo.orderNumber}`,
      text: emailContent,
      attachments: [
        {
          filename: `order-${orderInfo.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    console.log("Order email sent successfully")
  } catch (error) {
    console.error("Error sending order email:", error)
    throw error
  }
}
