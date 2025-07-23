"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandGrid } from "./BrandGrid"
import { SubmissionsTable } from "./SubmissionsTable"
import type { Brand, Submission } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { BrandForm } from "./BrandForm"

interface AdminDashboardProps {
  brands: Brand[]
  submissions: Submission[]
}

export default function AdminDashboard({ brands, submissions }: AdminDashboardProps) {
  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="brands">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>
          <BrandForm>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Brand
            </Button>
          </BrandForm>
        </div>
        <TabsContent value="brands" className="mt-4">
          <BrandGrid brands={brands} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={submissions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
