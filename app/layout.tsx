import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Printing Order Form",
  description: "Centralized order forms for all your brands.",
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
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">{children}</main>
          <footer className="w-full bg-white border-t border-gray-200 p-4 mt-8">
            <div className="text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Focus Print Group. All rights reserved.</p>
              <Link href="/admin" className="hover:underline mt-2 inline-block">
                Admin Panel
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
