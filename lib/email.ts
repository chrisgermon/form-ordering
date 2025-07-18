import nodemailer from "nodemailer"
import type { Brand } from "./types"

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

export async function sendOrderEmail(
  brand: Brand,
  submissionId: string,
  pdfBuffer: Buffer,
  clinicEmail: string | null,
  formData: Record<string, string>,
) {
  const toAddresses = [brand.email]
  if (clinicEmail) {
    toAddresses.push(clinicEmail)
  }

  const subject = `New Order Submission for ${brand.name} - #${submissionId}`

  const textBody =
    `A new order has been submitted for ${brand.name}.\n\n` +
    `Submission ID: ${submissionId}\n` +
    `Ordered By: ${formData.orderedBy || "N/A"}\n` +
    `Patient Name: ${formData.patientName || "N/A"}\n\n` +
    `The order PDF is attached.`

  const htmlBody = `
    <h2>New Order Submission for ${brand.name}</h2>
    <p>A new order has been submitted. Details below:</p>
    <ul>
      <li><strong>Submission ID:</strong> ${submissionId}</li>
      <li><strong>Ordered By:</strong> ${formData.orderedBy || "N/A"}</li>
      <li><strong>Patient Name:</strong> ${formData.patientName || "N/A"}</li>
    </ul>
    <p>The order PDF is attached to this email.</p>
  `

  await sendEmail({
    to: toAddresses,
    subject: subject,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        filename: `order-${submissionId}.pdf`,
        content: pdfBuffer,
      },
    ],
  })
}
