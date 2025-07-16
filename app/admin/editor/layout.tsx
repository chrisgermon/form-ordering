import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// This layout overrides the default admin layout to provide a full-screen
// container for the Budibase editor iframe.
export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-screen flex flex-col">
      <header className="border-b p-4">
        <Button asChild variant="link" className="p-0 h-auto">
          <Link href="/admin">← Back to Admin</Link>
        </Button>
      </header>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
