import nodemailer from "nodemailer"

export async function sendOrderEmail(
  toEmail: string,
  orderNumber: string,
  brandName: string,
  pdfBuffer: Buffer,
): Promise<void> {
  console.log("=== SENDING EMAIL ===")
  console.log("To:", toEmail)
  console.log("Order number:", orderNumber)
  console.log("Brand:", brandName)

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

    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@example.com",
      to: String(toEmail || ""),
      subject: `Order Confirmation - ${String(orderNumber || "")} - ${String(brandName || "")}`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Thank you for your order!</p>
        <p><strong>Order Number:</strong> ${String(orderNumber || "")}</p>
        <p><strong>Brand:</strong> ${String(brandName || "")}</p>
        <p>Please find your order details attached as a PDF.</p>
        <p>If you have any questions, please contact us.</p>
      `,
      attachments: [
        {
          filename: `order-${String(orderNumber || "unknown")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)
  } catch (error) {
    console.error("Email sending error:", error)
    throw new Error(`Failed to send email: ${String(error)}`)
  }
}
