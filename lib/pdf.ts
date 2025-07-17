import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"
import type { Brand, OrderInfo, OrderItem } from "@/lib/types"

function getPublicUrl(path: string): string {
  if (path.startsWith("http")) return path
  return `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${path.startsWith("/") ? "" : "/"}${path}`
}

function formatClinicHtml(title: string, clinic: { name: string; address: string } | null) {
  if (!clinic) return ""
  return `
    <div class="address-block">
      <p class="address-title"><strong>${title}:</strong></p>
      <p class="address-content">
        ${clinic.name}<br>
        ${clinic.address}
      </p>
    </div>
  `
}

function getPdfHtml(orderInfo: OrderInfo, items: OrderItem[], brand: Brand, logoUrl: string | null): string {
  const themeColor = "#2a3760"

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${brand.name} Logo" class="logo" />`
    : `<h1 class="brand-name">${brand.name}</h1>`

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td>${item.code || ""}</td>
      <td>${item.name}</td>
      <td class="quantity">${item.quantity}</td>
    </tr>
  `,
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Order #${orderInfo.orderNumber}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 40px auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid ${themeColor}; }
        .logo { max-width: 250px; max-height: 80px; }
        .brand-name { color: ${themeColor}; font-size: 28px; margin: 0; }
        .header-details { text-align: right; }
        .header-details h2 { color: ${themeColor}; margin: 0; font-size: 24px; }
        .header-details p { margin: 5px 0 0; font-size: 14px; color: #555; }
        .order-info { display: flex; justify-content: space-between; margin-top: 30px; }
        .address-block { width: 48%; }
        .address-title { font-size: 16px; color: ${themeColor}; margin-bottom: 5px; }
        .address-content { font-size: 14px; line-height: 1.5; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .items-table th { background-color: #f7f7f7; font-weight: bold; color: #333; }
        .items-table .quantity { text-align: center; }
        .notes { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid ${themeColor}; }
        .notes h4 { margin-top: 0; color: ${themeColor}; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoHtml}
          <div class="header-details">
            <h2>Printing Order</h2>
            <p><strong>Order #:</strong> ${orderInfo.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div class="order-info">
          ${formatClinicHtml("Deliver To", orderInfo.deliverTo ? { name: orderInfo.deliverTo.name, address: orderInfo.deliverTo.address } : null)}
          ${formatClinicHtml("Bill To", orderInfo.billTo ? { name: orderInfo.billTo.name, address: orderInfo.billTo.address } : null)}
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th class="quantity">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        ${
          orderInfo.notes
            ? `<div class="notes">
                 <h4>Notes:</h4>
                 <p>${orderInfo.notes}</p>
               </div>`
            : ""
        }
        <div class="footer">
          <p>Thank you for your order.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function generateOrderPdf(payload: {
  orderInfo: OrderInfo
  items: OrderItem[]
  brand: Brand
}): Promise<Buffer> {
  const { orderInfo, items, brand } = payload
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  })

  const page = await browser.newPage()
  const logoUrl = brand.logo ? getPublicUrl(brand.logo) : null
  const htmlContent = getPdfHtml(orderInfo, items, brand, logoUrl)

  await page.setContent(htmlContent, { waitUntil: "networkidle0" })

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  })

  await browser.close()
  return pdfBuffer
}
