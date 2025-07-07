"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Trash2, Plus } from "lucide-react"

import type { AllowedIp } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const ipSchema = z.object({
  ip_address: z.string().ip({ message: "Invalid IP address." }),
})

export function SystemActions({ allowedIps }: { allowedIps: AllowedIp[] }) {
  const router = useRouter()
  const [ips, setIps] = useState(allowedIps || [])

  const form = useForm<z.infer<typeof ipSchema>>({
    resolver: zodResolver(ipSchema),
    defaultValues: { ip_address: "" },
  })

  const handleAddIp = async (values: z.infer<typeof ipSchema>) => {
    toast.loading("Adding IP address...")
    try {
      const response = await fetch("/api/admin/allowed-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      toast.dismiss()
      if (!response.ok) throw new Error("Failed to add IP address.")
      toast.success("IP address added.")
      form.reset()
      router.refresh()
    } catch (error) {
      toast.dismiss()
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this IP address?")) return

    toast.loading("Removing IP address...")
    try {
      const response = await fetch(`/api/admin/allowed-ips?id=${id}`, { method: "DELETE" })
      toast.dismiss()
      if (!response.ok) throw new Error("Failed to remove IP address.")
      toast.success("IP address removed.")
      router.refresh()
    } catch (error) {
      toast.dismiss()
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Manage Allowed IPs</CardTitle>
          <CardDescription>Add or remove IP addresses that are allowed to access the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddIp)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="ip_address"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 192.168.1.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add IP</span>
              </Button>
            </form>
          </Form>
          <div className="mt-4 space-y-2">
            {(ips || []).map((ip) => (
              <div key={ip.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                <span className="font-mono text-sm">{ip.ip_address}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ip.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="sr-only">Delete IP</span>
                </Button>
              </div>
            ))}
          </div>
          {(!ips || ips.length === 0) && (
            <p className="text-center text-sm text-muted-foreground mt-4">No IP addresses configured.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
          <CardDescription>Actions for maintaining the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Force Schema Reload</h4>
              <p className="text-sm text-muted-foreground mb-2">
                This will force Supabase to reload the database schema. Useful after running migration scripts.
              </p>
              <Button
                variant="destructive"
                onClick={async () => {
                  toast.loading("Forcing schema reload...")
                  const res = await fetch("/api/admin/submissions?action=reload-schema", { method: "POST" })
                  toast.dismiss()
                  if (res.ok) {
                    toast.success("Schema reload requested.")
                  } else {
                    toast.error("Failed to request schema reload.")
                  }
                }}
              >
                Reload Schema
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
