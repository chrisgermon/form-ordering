import nodemailer from "nodemailer"
import type { Brand } from "@/lib/types"

function generateConfirmationEmailHtml(brandName: string, orderId: string | number): string {
  const themeColor = "#2a3760"
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
      <h2 style="color: ${themeColor}; font-size: 22px;">Order Confirmation</h2>
      <p>Thank you for your order with <strong>${brandName}</strong>.</p>
      <p>Your order number is <strong>#${orderId}</strong>.</p>
      <p>We have received your order and will begin processing it shortly. A PDF copy of your order form is attached to this email for your records.</p>
      <p>If you have any questions, please contact us.</p>
      <br>
      <p>Thank you,</p>
      <p>The ${brandName} Team</p>
    </div>
  `
}

export async function sendOrderConfirmationEmail(payload: {
  to: string[]
  brand: Brand
  orderId: string | number
  pdfBuffer: Buffer
}) {
  const { to, brand, orderId, pdfBuffer } = payload

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
    to: to.join(","),
    subject: `Order Confirmation for ${brand.name} - #${orderId}`,
    html: generateConfirmationEmailHtml(brand.name, orderId),
    attachments: [
      {
        filename: `order-${brand.slug}-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Confirmation email sent: " + info.response)
  } catch (error) {
    console.error("Error sending confirmation email:", error)
    // We don't want to fail the whole request if the email fails,
    // so we just log the error. The order is already saved.
  }
}
