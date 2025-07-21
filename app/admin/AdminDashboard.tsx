"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandGrid } from "./BrandGrid"
import { FileManager } from "./FileManager"
import { OrdersTable } from "./OrdersTable"
import type { Brand, OrderWithBrand } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { handleSignOut } from "./actions"

export default function AdminDashboard({
  orders,
  brands,
  user,
}: {
  orders: OrderWithBrand[]
  brands: Brand[]
  user: User
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>{user.email}</span>
          <form action={handleSignOut}>
            <Button variant="outline" size="icon">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign Out</span>
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="brands">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="files">File Manager</TabsTrigger>
          </TabsList>
          <TabsContent value="brands">
            <BrandGrid brands={brands} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTable orders={orders} />
          </TabsContent>
          <TabsContent value="files">
            <FileManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
