"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Trash2, FileText } from "lucide-react"

import type { Brand } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { resolveAssetUrl } from "@/lib/utils"
import { deleteBrand } from "./actions"
import { BrandForm } from "./BrandForm"

interface BrandGridProps {
  brands: Brand[]
  onBrandChange: () => void
}

export function BrandGrid({ brands, onBrandChange }: BrandGridProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this brand and all its data? This cannot be undone.")) {
      return
    }
    const result = await deleteBrand(id)
    if (result.success) {
      toast.success("Brand deleted successfully.")
      onBrandChange() // Notify parent to refetch brands
    } else {
      toast.error("Failed to delete brand.", { description: result.error })
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedBrand(null)
  }

  // Add a safe check for the brands prop
  if (!brands) {
    return <p className="text-center text-gray-500 mt-8">Loading brands...</p>
  }
  if (brands.length === 0) {
    return <p className="text-center text-gray-500 mt-8">No brands found. Add one to get started.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <div key={brand.id} className="border rounded-lg shadow-sm flex flex-col bg-white">
            <div className="p-4 flex-grow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Image
                    src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                    alt={`${brand.name} logo`}
                    width={48}
                    height={48}
                    className="rounded-md object-contain border h-12 w-12 bg-gray-50"
                  />
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg truncate">{brand.name}</h3>
                    <p className="text-sm text-gray-500 truncate">/{brand.slug}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(brand)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Edit Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/editor/${brand.slug}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Open Form Editor</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(brand.id)}
                      className="text-red-600 focus:text-white focus:bg-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="border-t p-3 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/forms/${brand.slug}`} target="_blank">
                  View Live Form
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
      {isFormOpen && (
        <BrandForm isOpen={isFormOpen} onClose={handleFormClose} brand={selectedBrand} onBrandChange={onBrandChange} />
      )}
    </>
  )
}
