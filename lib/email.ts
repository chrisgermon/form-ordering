import nodemailer, { type SendMailOptions } from "nodemailer"

// Ensure environment variables are defined
const { MAILGUN_SMTP_HOST, MAILGUN_SMTP_PORT, MAILGUN_SMTP_USERNAME, MAILGUN_SMTP_PASSWORD, FROM_EMAIL } = process.env

if (!MAILGUN_SMTP_HOST || !MAILGUN_SMTP_PORT || !MAILGUN_SMTP_USERNAME || !MAILGUN_SMTP_PASSWORD || !FROM_EMAIL) {
  if (process.env.NODE_ENV === "production") {
    console.error("Missing required Mailgun SMTP environment variables.")
  } else {
    console.warn("Missing Mailgun SMTP environment variables. Email sending will be disabled.")
  }
}

const transporter =
  MAILGUN_SMTP_HOST && MAILGUN_SMTP_PORT && MAILGUN_SMTP_USERNAME && MAILGUN_SMTP_PASSWORD
    ? nodemailer.createTransporter({
        host: MAILGUN_SMTP_HOST,
        port: Number.parseInt(MAILGUN_SMTP_PORT, 10),
        secure: false, // Use STARTTLS
        auth: {
          user: MAILGUN_SMTP_USERNAME,
          pass: MAILGUN_SMTP_PASSWORD,
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false,
        },
      })
    : null

export function generateOrderEmailTemplate(submission: any): string {
  const items = Array.isArray(submission.items) ? submission.items : Object.values(submission.items || {})
  const itemsHtml = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name || "Unknown Item"}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${
        item.quantity === "other" ? `${item.customQuantity || "N/A"} (custom)` : item.quantity || "N/A"
      }</td>
    </tr>
  `,
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .header h1 { margin: 0; color: #0056b3; }
        .content { padding: 20px 0; }
        .content h2 { color: #0056b3; }
        .info-table, .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table td, .items-table th, .items-table td { padding: 8px; border: 1px solid #ddd; }
        .info-table td:first-child { font-weight: bold; width: 150px; }
        .items-table th { background-color: #f2f2f2; text-align: left; }
        .footer { text-align: center; font-size: 0.9em; color: #777; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Submission</h1>
        </div>
        <div class="content">
          <h2>Order Details</h2>
          <table class="info-table">
            <tr><td>Brand:</td><td>${submission.brand_name || "Unknown Brand"}</td></tr>
            <tr><td>Submitted By:</td><td>${submission.submitted_by || submission.ordered_by || "Unknown"}</td></tr>
            <tr><td>Email:</td><td>${submission.email || "Not provided"}</td></tr>
            <tr><td>Bill To:</td><td>${submission.bill_to || "Not specified"}</td></tr>
            <tr><td>Deliver To:</td><td>${submission.deliver_to || submission.clinic_name || "Not specified"}</td></tr>
            <tr><td>Date:</td><td>${new Date(submission.created_at || Date.now()).toLocaleString()}</td></tr>
          </table>
          <h2>Ordered Items</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th style="text-align: center;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendEmail({
  to,
  cc,
  subject,
  html,
  attachments,
}: {
  to: string
  cc?: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer; contentType: string }[]
}) {
  console.log("Attempting to send email to:", to)
  console.log("Email configuration:", {
    host: MAILGUN_SMTP_HOST,
    port: MAILGUN_SMTP_PORT,
    user: MAILGUN_SMTP_USERNAME,
    from: FROM_EMAIL,
    hasTransporter: !!transporter,
  })

  if (!transporter) {
    console.error("Email transporter is not configured. Cannot send email.")
    if (process.env.NODE_ENV !== "production") {
      console.log("--- FAKE EMAIL (sending disabled) ---")
      console.log(`To: ${to}`)
      if (cc) console.log(`CC: ${cc}`)
      console.log(`Subject: ${subject}`)
      console.log("-------------------------------------")
    }
    return { success: false, error: "Email transporter not configured" }
  }

  const mailOptions: SendMailOptions = {
    from: FROM_EMAIL,
    to: to,
    subject: subject,
    html: html,
    attachments: attachments,
  }

  if (cc) {
    mailOptions.cc = cc
  }

  try {
    console.log("Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
      attachmentCount: attachments?.length || 0,
    })

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)
    return { success: true, info }
  } catch (error) {
    console.error("Error sending email:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown email error"

    // For connection timeout errors, provide more helpful feedback
    if (errorMessage.includes("Greeting never received") || errorMessage.includes("ETIMEDOUT")) {
      return {
        success: false,
        error: "Email server connection timeout. Please check SMTP configuration and network connectivity.",
      }
    }

    return { success: false, error: errorMessage }
  }
}
