import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SuccessPage({ params }: { params: { brandSlug: string } }) {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold mt-4">Order Submitted Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your order. A confirmation email with the order details has been sent.
          </p>
          <Button asChild>
            <Link href={`/forms/${params.brandSlug}`}>Submit Another Order</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
