import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export function ErrorDisplay({ message }: { message: string }) {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            An Error Occurred
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not load the form.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong>Details:</strong> {message}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
