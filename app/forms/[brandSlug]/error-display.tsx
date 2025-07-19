import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-xl">An Error Occurred</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">{message}</p>
        </CardContent>
      </Card>
    </div>
  )
}
