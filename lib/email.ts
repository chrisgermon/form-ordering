import nodemailer from "nodemailer"

type EmailPayload = {
  to: string | string[]
  subject: string
  text: string
  html?: string
  attachments?: { filename: string; content: Buffer }[]
}

const smtpOptions = {
  host: process.env.MAILGUN_SMTP_HOST,
  port: Number.parseInt(process.env.MAILGUN_SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAILGUN_SMTP_USERNAME,
    pass: process.env.MAILGUN_SMTP_PASSWORD,
  },
}

export async function sendEmail(data: EmailPayload) {
  const transporter = nodemailer.createTransport({
    ...smtpOptions,
  })

  return await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    ...data,
  })
}
