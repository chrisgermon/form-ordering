import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function OrderSuccessPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const orderId = searchParams.orderId

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold mt-4">Order Submitted!</CardTitle>
          <CardDescription className="text-lg text-gray-600">Thank you for your order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Your order has been received and is now being processed. You will receive a confirmation email shortly with
            the order details.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 bg-gray-100 rounded-md p-2">
              Your Order ID is: <span className="font-mono font-semibold">{orderId}</span>
            </p>
          )}
          <Button asChild className="w-full">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
