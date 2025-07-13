import { ShieldOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AccessDeniedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md text-center p-4">
        <CardHeader>
          <div className="mx-auto bg-red-100 p-4 rounded-full w-fit">
            <ShieldOff className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Your IP address does not have permission to access this page. Please contact the system administrator if you
            believe this is an error.
          </p>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
