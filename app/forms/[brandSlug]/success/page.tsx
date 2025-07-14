import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: { brandSlug: string }
  searchParams: { orderId?: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">Order Submitted Successfully!</CardTitle>
          <CardDescription>
            Thank you for your order. We've received it and will begin processing it shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchParams.orderId && (
            <p className="text-sm text-gray-600">
              Your Order ID is: <span className="font-mono bg-gray-100 p-1 rounded">{searchParams.orderId}</span>
            </p>
          )}
          <p className="text-sm text-gray-500">
            A confirmation email with the order details and a PDF copy has been sent to you.
          </p>
          <Button asChild>
            <Link href={`/forms/${params.brandSlug}`}>Submit Another Order</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
