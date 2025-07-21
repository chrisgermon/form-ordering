import nodemailer from "nodemailer"
import type { EmailData } from "./types"

type EmailPayload = {
  to: string | string[]
  subject: string
  text: string
  html: string
  attachments?: { filename: string; content: Buffer }[]
}

const smtpOptions = {
  host: process.env.MAILGUN_SMTP_HOST,
  port: Number.parseInt(process.env.MAILGUN_SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.MAILGUN_SMTP_USERNAME,
    pass: process.env.MAILGUN_SMTP_PASSWORD,
  },
}

async function sendEmail(data: EmailPayload) {
  const transporter = nodemailer.createTransport({
    ...smtpOptions,
  })

  return await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    ...data,
  })
}

export async function sendOrderEmail({ brandName, submissionId, pdfBuffer }: EmailData) {
  // This function seems to be missing the recipient logic.
  // Assuming it should go to an admin or a predefined brand email.
  // This needs to be implemented based on business logic.
  console.log(`Placeholder for sending order email for ${brandName}, submission ${submissionId}.`)
}

export async function sendCompletionEmail(recipientEmail: string, brandName: string, submissionId: string) {
  const subject = `Your Order for ${brandName} is Complete (Ref: #${submissionId})`
  const textBody = `Your order #${submissionId} for ${brandName} has been processed and is now complete.\n\nThank you for your order.`
  const htmlBody = `
    <h2>Order Complete!</h2>
    <p>Your order <strong>#${submissionId}</strong> for <strong>${brandName}</strong> has been processed and is now complete.</p>
    <p>Thank you for your order.</p>
  `

  await sendEmail({
    to: recipientEmail,
    subject: subject,
    text: textBody,
    html: htmlBody,
  })
}
