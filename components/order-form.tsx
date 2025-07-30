"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Brand } from "@/lib/types"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  ordered_by: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  bill_to: z.string().min(2, { message: "Billing info is required." }),
  deliver_to: z.string().min(2, { message: "Delivery info is required." }),
  items: z.record(z.string(), z.number().min(0)),
})

type OrderFormValues = z.infer<typeof formSchema>

export default function OrderForm({ brand }: { brand: Brand }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; message: string } | null>(null)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ordered_by: "",
      email: "",
      bill_to: "",
      deliver_to: "",
      items: {},
    },
  })

  async function onSubmit(values: OrderFormValues) {
    setIsSubmitting(true)
    setSubmissionResult(null)
    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, brandId: brand.id }),
      })

      const result = await response.json()
      if (response.ok) {
        setSubmissionResult({
          success: true,
          message: "Order submitted successfully! A confirmation has been sent to your email.",
        })
        form.reset()
      } else {
        throw new Error(result.error || "An unknown error occurred.")
      }
    } catch (error) {
      setSubmissionResult({ success: false, message: `Submission failed: ${error.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Order Form for {brand.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Form fields would go here, mapping over brand.sections and brand.items */}
            <p className="text-muted-foreground">Item selection UI would be rendered here based on brand data.</p>
            <FormField
              control={form.control}
              name="ordered_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Other fields like email, bill_to, deliver_to */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Order
            </Button>
          </form>
        </Form>
        {submissionResult && (
          <div className={`mt-4 text-sm ${submissionResult.success ? "text-green-600" : "text-red-600"}`}>
            {submissionResult.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
