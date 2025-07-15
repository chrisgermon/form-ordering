import type { ReactNode } from "react"

// This layout overrides the default admin layout to provide a full-screen
// container for the Budibase editor iframe.
export default function EditorLayout({ children }: { children: ReactNode }) {
  return <div className="w-full h-screen">{children}</div>
}
