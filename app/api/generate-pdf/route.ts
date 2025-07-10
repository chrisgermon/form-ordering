import { type NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json()

    if (!html) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 })
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setContent(html)

    const pdfBuffer = await page.pdf({ format: "A4" })

    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="document.pdf"',
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
