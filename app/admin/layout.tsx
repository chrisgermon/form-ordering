import { Toaster } from "sonner"
import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b p-4">
        <Button asChild variant="link" className="p-0 h-auto">
          <Link href="/">← Home</Link>
        </Button>
      </header>
      <div className="p-4">{children}</div>
      <Toaster richColors position="top-right" />
    </>
  )
}
