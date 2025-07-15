import nodemailer from "nodemailer"
import type { OrderPayload, Brand, ClinicLocation } from "@/lib/types"
import { generatePdf } from "@/lib/pdf"

function formatClinicHtml(title: string, clinic: ClinicLocation | null) {
  if (!clinic) return ""
  return `
    <p style="margin: 5px 0;">
      <strong>${title}:</strong> ${clinic.name}<br>
      ${
        clinic.address
          ? `<span style="font-size: 12px; color: #555; padding-left: 10px;">${clinic.address}</span><br>`
          : ""
      }
      ${clinic.phone ? `<span style="font-size: 12px; color: #555; padding-left: 10px;">${clinic.phone}</span>` : ""}
    </p>
  `
}

function generateOrderEmailHtml(order: OrderPayload, brand: Brand, logoUrl: string | null): string {
  const { orderInfo, items } = order
  const themeColor = "#2a3760"

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${brand.name} Logo" style="max-width: 200px; max-height: 70px; margin-bottom: 20px;" />`
    : `<h1 style="color: ${themeColor}; font-size: 24px;">${brand.name}</h1>`

  const itemsHtml = Object.values(items || {})
    .map(
      (item: any) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;">${item.code}</td>
      <td style="padding: 10px;">${item.name}</td>
      <td style="padding: 10px; text-align: center;">${
        item.quantity === "other" ? item.customQuantity : item.quantity
      }</td>
    </tr>
  `,
    )
    .join("")

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
      ${logoHtml}
      <h2 style="color: ${themeColor}; font-size: 22px;">New Printing Order</h2>
      <p>A new order has been submitted for <strong>${brand.name}</strong>.</p>
      
      <h3 style="color: ${themeColor}; font-size: 20px; border-bottom: 2px solid ${themeColor}; padding-bottom: 5px;">Order Details</h3>
      <p><strong>Order Number:</strong> ${orderInfo.orderNumber}</p>
      <p><strong>Ordered By:</strong> ${orderInfo.orderedBy}</p>
      <p><strong>Email:</strong> ${orderInfo.email}</p>
      ${formatClinicHtml("Bill To", orderInfo.billTo)}
      ${formatClinicHtml("Deliver To", orderInfo.deliverTo)}
      
      <h3 style="color: ${themeColor}; font-size: 20px; border-bottom: 2px solid ${themeColor}; padding-bottom: 5px;">Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr>
            <th style="padding: 10px; text-align: left; background-color: #f7f7f7;">Code</th>
            <th style="padding: 10px; text-align: left; background-color: #f7f7f7;">Name</th>
            <th style="padding: 10px; text-align: center; background-color: #f7f7f7;">Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      ${
        orderInfo.notes
          ? `<div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
               <h4 style="margin-top: 0; color: ${themeColor};">Notes:</h4>
               <p style="margin-bottom: 0;">${orderInfo.notes}</p>
             </div>`
          : ""
      }
      
      <p style="margin-top: 20px;">The order form is attached to this email as a PDF.</p>
    </div>
  `
}

export async function sendOrderEmail(order: OrderPayload, brand: Brand, pdfBuffer: Buffer, logoUrl: string | null) {
  const transporter = nodemailer.createTransport({
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILGUN_SMTP_USERNAME,
      pass: process.env.MAILGUN_SMTP_PASSWORD,
    },
  })

  const mailOptions = {
    from: `"${brand.name} Orders" <${process.env.FROM_EMAIL}>`,
    to: brand.emails.join(","),
    cc: order.orderInfo.email,
    subject: `New Printing Order for ${brand.name} - #${order.orderInfo.orderNumber}`,
    html: generateOrderEmailHtml(order, brand, logoUrl),
    attachments: [
      {
        filename: `order-${order.orderInfo.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent: " + info.response)
    return { success: true, message: info.response }
  } catch (error) {
    console.error("Error sending email:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown email error"
    return { success: false, message: errorMessage }
  }
}

export async function generatePdfAndSendEmail(order: OrderPayload, brand: Brand) {
  console.log("Generating PDF and sending email for brand:", brand.name)
  try {
    const pdfBuffer = await generatePdf(order, brand)
    console.log("PDF generated successfully. Size:", pdfBuffer.length)

    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILGUN_SMTP_USERNAME,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    })

    const mailOptions = {
      from: `"${brand.name} Orders" <${process.env.FROM_EMAIL}>`,
      to: brand.email_recipients.join(", "),
      subject: `New Order Received - #${order.orderInfo.orderNumber}`,
      html: `<p>A new order has been submitted. Please find the details in the attached PDF.</p>`,
      attachments: [
        {
          filename: `Order-${order.orderInfo.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)
    return { success: true, message: "Email sent successfully." }
  } catch (error) {
    console.error("Error in generatePdfAndSendEmail:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message }
  }
}
