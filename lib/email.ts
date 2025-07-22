import nodemailer from "nodemailer"
import type { Brand } from "./types"

type EmailPayload = {
  to: string | string[]
  subject: string
  text: string
  html: string
  attachments?: { filename: string; content: Buffer; contentType: string }[]
  replyTo?: string
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

export async function sendSubmissionEmail(brand: Brand, formData: FormData, pdfBuffer: Buffer) {
  const patientName = formData.get("patientName") as string
  const referringDoctor = formData.get("referringDoctor") as string
  const submissionDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const subject = `New Referral Submission for ${brand.name} from ${referringDoctor}`
  const textBody = `A new referral form has been submitted for ${patientName} on ${submissionDate}. Please find the attached PDF for details.`
  const htmlBody = `
    <h2>New Referral Submission</h2>
    <p><strong>Brand:</strong> ${brand.name}</p>
    <p><strong>Patient:</strong> ${patientName}</p>
    <p><strong>Referring Doctor:</strong> ${referringDoctor}</p>
    <p><strong>Date:</strong> ${submissionDate}</p>
    <p>The completed referral form is attached as a PDF.</p>
  `

  if (!brand.emails || brand.emails.length === 0) {
    console.warn(`No recipient emails configured for brand: ${brand.name}. Skipping email.`)
    return
  }

  await sendEmail({
    to: brand.emails,
    subject: subject,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        filename: `${brand.slug}-submission-${patientName.replace(/\s/g, "_")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  })
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
