import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SuccessPage({
  params,
  searchParams,
}: {
  params: { brandSlug: string }
  searchParams: { orderId?: string }
}) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-green-600">Order Submitted Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Thank you for your order. We have received your submission and will process it shortly.</p>
          {searchParams.orderId && <p className="text-sm text-gray-600">Order ID: {searchParams.orderId}</p>}
          <p>You should receive a confirmation email shortly with your order details.</p>
          <div className="pt-4">
            <Link href={`/forms/${params.brandSlug}`}>
              <Button variant="outline">Submit Another Order</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
