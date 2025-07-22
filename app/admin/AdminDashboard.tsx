"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import type { Brand, Submission } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { handleSignOut } from "./actions"
import { BrandGrid } from "./BrandGrid"
import { SubmissionsTable } from "./SubmissionsTable"
import { BrandForm } from "./BrandForm"
import { PlusCircle } from "lucide-react"

interface AdminDashboardProps {
  user: User
  brands: Brand[]
  submissions: Submission[]
}

export default function AdminDashboard({ user, brands, submissions }: AdminDashboardProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleAddNewBrand = () => {
    setSelectedBrand(null)
    setIsFormOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedBrand(null)
    router.refresh() // Refresh data when form is closed
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>{user.email}</span>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6 grid gap-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Brands</h2>
              <Button onClick={handleAddNewBrand}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Brand
              </Button>
            </div>
            <BrandGrid brands={brands} onEditBrand={handleEditBrand} onBrandChange={() => router.refresh()} />
          </section>
          <section>
            <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
            <SubmissionsTable submissions={submissions} />
          </section>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
          </DialogHeader>
          <BrandForm brand={selectedBrand} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </>
  )
}
