"use client" // Global error boundaries must be Client Components

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // You can log the error to an error reporting service here
    console.error(error)
  }, [error])

  return (
    // A global-error must include its own <html> and <body> tags.
    <html>
      <body>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="mt-4 text-2xl font-bold">Something went wrong!</CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                An unexpected error occurred. We have been notified and are looking into it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => reset()} className="w-full">
                Try again
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  )
}
