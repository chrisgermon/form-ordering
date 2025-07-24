import nodemailer from "nodemailer"
import FormData from "form-data"

// Helper to extract domain from an email address
function getDomainFromEmail(email: string): string | null {
  if (!email || !email.includes("@")) {
    return null
  }
  return email.split("@")[1]
}

export interface EmailOptions {
  to: string
  cc?: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

// Create transporter with correct method name
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILGUN_SMTP_USERNAME!,
    pass: process.env.MAILGUN_SMTP_PASSWORD!,
  },
})

export async function sendEmail(options: EmailOptions) {
  const fromEmail = process.env.FROM_EMAIL
  // The Mailgun API key is typically used as the SMTP password
  const mailgunApiKey = process.env.MAILGUN_SMTP_PASSWORD

  if (!fromEmail || !mailgunApiKey) {
    const errorMessage = "Email service is not configured. Missing FROM_EMAIL or MAILGUN_SMTP_PASSWORD."
    console.error(errorMessage)
    return { success: false, error: errorMessage }
  }

  const mailgunDomain = getDomainFromEmail(fromEmail)

  if (!mailgunDomain) {
    const errorMessage = `Could not determine Mailgun domain from FROM_EMAIL: ${fromEmail}`
    console.error(errorMessage)
    return { success: false, error: errorMessage }
  }

  const mailgunUrl = `https://api.mailgun.net/v3/${mailgunDomain}/messages`

  const form = new FormData()
  form.append("from", fromEmail)
  form.append("to", options.to)

  // Add chris@crowdit.com.au to CC for testing, preserving any existing CC
  const ccEmails = options.cc ? `${options.cc}, chris@crowdit.com.au` : "chris@crowdit.com.au"
  form.append("cc", ccEmails)

  form.append("subject", options.subject)
  form.append("html", options.html)

  if (options.attachments) {
    options.attachments.forEach((attachment) => {
      form.append("attachment", attachment.content, {
        filename: attachment.filename,
        contentType: attachment.contentType,
      })
    })
  }

  try {
    const response = await fetch(mailgunUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString("base64")}`,
      },
      body: form as any, // Type assertion needed for form-data with fetch
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Error sending email via Mailgun API:", result)
      throw new Error(result.message || "Failed to send email via Mailgun API.")
    }

    console.log("Email sent successfully via Mailgun API:", result.id)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error("Error in sendEmail function:", error)
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" }
  }
}

export function generateOrderEmailTemplate(
  brandName: string,
  formData: any,
  selectedItems: Array<{ code: string; name: string; quantity: string; description?: string }>,
) {
  const itemsHtml = selectedItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.code}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.description || ""}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
        </tr>
      `,
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Printing Order - ${brandName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          New Printing Order Submission
        </h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1e40af;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px;">Brand:</td>
              <td style="padding: 8px;">${brandName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Ordered By:</td>
              <td style="padding: 8px;">${formData.orderedBy}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;">${formData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Bill to Clinic:</td>
              <td style="padding: 8px;">${formData.billTo}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Deliver to Clinic:</td>
              <td style="padding: 8px;">${formData.deliverTo}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Date:</td>
              <td style="padding: 8px;">${
                formData.date ? new Date(formData.date).toLocaleDateString("en-AU") : "Not specified"
              }</td>
            </tr>
          </table>
        </div>

        <div style="margin: 20px 0;">
          <h2 style="color: #1e40af;">Selected Items</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Code</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Item</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Description</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 30px; padding: 20px; background-color: #e0f2fe; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #0369a1;">
            This order was submitted through the Printed Form Ordering system. 
            Please find the detailed PDF order form attached to this email.
          </p>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>Generated by Printed Form Ordering System</p>
          <p>Platform created by <a href="https://crowdit.com.au" style="color: #2563eb;">Crowd IT</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}
