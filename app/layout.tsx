import type React from "react"
import type { Metadata } from "next"
import { Inter, Work_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const work_sans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
})

export const metadata: Metadata = {
  title: "VRG Form Ordering System",
  description: "Printing order forms for the Vision Radiology Group.",
  icons: {
    icon: "/favicon.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, work_sans.variable, "font-sans")}>{children}</body>
    </html>
  )
}
