"use client"

import { useState } from "react"
import type { Brand } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import BrandEditor from "./BrandEditor"
import Link from "next/link"
import Image from "next/image"
import { PlusCircle } from "lucide-react"

interface AdminDashboardProps {
  brands: Brand[]
}

export default function AdminDashboard({ brands }: AdminDashboardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleOpenEditor = (brand: Brand | null = null) => {
    setSelectedBrand(brand)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setSelectedBrand(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Brands</CardTitle>
            <CardDescription>Manage your brands and their order forms.</CardDescription>
          </div>
          <Button onClick={() => handleOpenEditor()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Brand
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <Image
                      src={brand.logo || "/placeholder-logo.svg"}
                      alt={`${brand.name} logo`}
                      width={40}
                      height={40}
                      className="rounded-sm object-contain"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>
                    <Badge variant={brand.active ? "default" : "secondary"}>
                      {brand.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/editor/${brand.slug}`}>Form</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditor(brand)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isEditorOpen && <BrandEditor brand={selectedBrand} isOpen={isEditorOpen} onClose={handleCloseEditor} />}
    </>
  )
}
