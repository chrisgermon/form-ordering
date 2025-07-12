"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Trash2, Loader2, FileIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { format } from "date-fns"
import { resolveAssetUrl } from "@/lib/utils"
import type { UploadedFile, Brand } from "@/lib/types"

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

function UploadDialog({
  open,
  onOpenChange,
  onUploadSuccess,
  brands,
  defaultBrandId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess: () => void
  brands: Brand[]
  defaultBrandId?: string | null
}) {
  const [file, setFile] = useState<File | null>(null)
  const [brandId, setBrandId] = useState<string | undefined | null>(defaultBrandId)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (open) {
      setFile(null)
      setBrandId(defaultBrandId)
      setIsUploading(false)
    }
  }, [open, defaultBrandId])

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.")
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const url = brandId ? `/api/admin/upload?brandId=${brandId}` : "/api/admin/upload"

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })
      if (response.ok) {
        toast.success("File uploaded successfully.")
        onUploadSuccess()
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        toast.error(`Failed to upload file: ${errorData.error}`)
      }
    } catch (error) {
      toast.error("An error occurred during upload.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New File</DialogTitle>
          <DialogDescription>Select a file and optionally assign it to a brand.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="file-upload">File</Label>
            <Input id="file-upload" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {!defaultBrandId && (
            <div>
              <Label htmlFor="brand-select">Assign to Brand (optional)</Label>
              <Select value={brandId || "none"} onValueChange={(value) => setBrandId(value === "none" ? null : value)}>
                <SelectTrigger id="brand-select">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Brand (Global)</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FileManager({
  initialFiles,
  brands,
  onFilesUpdate,
  isEmbedded = false,
  brandId: embeddedBrandId,
}: {
  initialFiles: UploadedFile[]
  brands: Brand[]
  onFilesUpdate: () => void
  isEmbedded?: boolean
  brandId?: string | null
}) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles)
  const [filter, setFilter] = useState<string>(isEmbedded ? embeddedBrandId || "global" : "global")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  useEffect(() => {
    setFiles(initialFiles)
  }, [initialFiles])

  const filteredFiles = useMemo(() => {
    if (isEmbedded) {
      return files
    }
    if (filter === "global") {
      return files
    }
    return files.filter((file) => file.brand_id === filter)
  }, [files, filter, isEmbedded])

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/files?id=${fileId}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("File deleted successfully.")
        onFilesUpdate()
      } else {
        toast.error("Failed to delete file.")
      }
    } catch (error) {
      toast.error("An error occurred while deleting the file.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        {!isEmbedded && (
          <div className="flex-1 min-w-[200px]">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (All Files)</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className={isEmbedded ? "w-full flex justify-end" : ""}>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Preview</TableHead>
              <TableHead>File Name</TableHead>
              {!isEmbedded && <TableHead>Brand</TableHead>}
              <TableHead>Size</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    {file.content_type?.startsWith("image/") ? (
                      <Image
                        src={resolveAssetUrl(file.pathname) || "/placeholder.svg"}
                        alt={file.original_name}
                        width={50}
                        height={50}
                        className="object-cover rounded-md bg-gray-100"
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] flex items-center justify-center bg-gray-100 rounded-md">
                        <FileIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <a
                      href={resolveAssetUrl(file.pathname)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {file.original_name}
                    </a>
                  </TableCell>
                  {!isEmbedded && (
                    <TableCell>
                      {file.brand_id ? (
                        <Badge variant="secondary">{brands.find((b) => b.id === file.brand_id)?.name || "N/A"}</Badge>
                      ) : (
                        <Badge variant="outline">Global</Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>{format(new Date(file.uploaded_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isEmbedded ? 4 : 5} className="h-24 text-center">
                  No files found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadSuccess={onFilesUpdate}
        brands={brands}
        defaultBrandId={isEmbedded ? embeddedBrandId : undefined}
      />
    </div>
  )
}
