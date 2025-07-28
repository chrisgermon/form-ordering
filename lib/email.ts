import nodemailer from "nodemailer"

interface EmailData {
  to: string
  cc?: string
  subject: string
  brandName: string
  orderedBy: string
  email: string
  phone?: string
  billTo: string
  deliverTo: string
  specialInstructions?: string
  items: Record<string, any>
  pdfBuffer: Buffer
  pdfUrl: string
}

export async function sendOrderEmail(data: EmailData) {
  try {
    console.log("Configuring email transporter...")
    const transporter = nodemailer.createTransport({
      host: process.env.MAILGUN_SMTP_HOST,
      port: Number.parseInt(process.env.MAILGUN_SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USERNAME,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    })

    console.log("Generating email content...")
    const htmlContent = generateOrderEmailTemplate(data)

    console.log(`Sending email to: ${data.to}, CC: ${data.cc}`)
    const info = await transporter.sendMail({
      from: `"${data.brandName} Orders" <${process.env.FROM_EMAIL}>`,
      to: data.to,
      cc: data.cc,
      subject: data.subject,
      html: htmlContent,
      attachments: [
        {
          filename: `order-${data.brandName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          content: data.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    console.log("Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    // Re-throw the error to be caught by the API route
    throw new Error(`Failed to send email: ${(error as Error).message}`)
  }
}

function generateOrderEmailTemplate(data: EmailData): string {
  const itemsList = Object.values(data.items)
    .map(
      (item: any) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${
            item.quantity === "other" ? item.customQuantity : item.quantity
          }</td>
        </tr>`,
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          New Order for ${data.brandName}
        </h1>
        
        <h2>Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; width: 150px;">Ordered By:</td><td style="padding: 8px;">${data.orderedBy}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Email:</td><td style="padding: 8px;">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Phone:</td><td style="padding: 8px;">${data.phone}</td></tr>` : ""}
          <tr><td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Bill To:</td><td style="padding: 8px;">${data.billTo}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Deliver To:</td><td style="padding: 8px;">${data.deliverTo}</td></tr>
        </table>

        <h2>Items Ordered</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        ${data.specialInstructions ? `<h2>Special Instructions</h2><p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2563eb;">${data.specialInstructions}</p>` : ""}

        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; text-align: center;">
          <p>A PDF copy of this order is attached.</p>
          <p><a href="${data.pdfUrl}" style="color: #2563eb; text-decoration: none;">Download PDF</a></p>
          <p style="margin: 0; font-size: 12px; color: #666;">This order was submitted on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `
}
