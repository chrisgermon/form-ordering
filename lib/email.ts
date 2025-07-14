import nodemailer from "nodemailer"

// Create transporter with correct method name for Mailgun
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILGUN_SMTP_USERNAME!,
    pass: process.env.MAILGUN_SMTP_PASSWORD!,
  },
})

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

export async function sendEmail(options: EmailOptions) {
  try {
    // Add chris@crowdit.com.au to CC for testing
    const ccEmails = options.cc ? `${options.cc}, chris@crowdit.com.au` : "chris@crowdit.com.au"

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || "noreply@printedforms.com.au",
      to: options.to,
      cc: ccEmails,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    })

    console.log("Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export function generateOrderEmailTemplate(
  brandName: string,
  formData: any,
  selectedItems: Array<{ code: string; name: string; quantity: string; description?: string }>,
  orderNumber: string,
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
     <title>New Printing Order - ${orderNumber}</title>
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
             <td style="padding: 8px; font-weight: bold; width: 150px;">Order Number:</td>
             <td style="padding: 8px;"><strong>${orderNumber}</strong></td>
           </tr>
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
