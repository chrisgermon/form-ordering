"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { addAllowedIp, deleteAllowedIp, runSchemaMigration } from "./actions"
import type { AllowedIp } from "@/lib/types"
import { Trash2 } from "lucide-react"

export function SystemActions({ allowedIps: initialAllowedIps }: { allowedIps: AllowedIp[] }) {
  const [allowedIps, setAllowedIps] = useState<AllowedIp[]>(initialAllowedIps)
  const [newIp, setNewIp] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  const handleAddIp = async () => {
    if (!newIp.trim()) {
      toast.error("IP address cannot be empty.")
      return
    }
    setIsAdding(true)
    const result = await addAllowedIp(newIp)
    if (result.success && result.data) {
      setAllowedIps([...allowedIps, result.data])
      setNewIp("")
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
    setIsAdding(false)
  }

  const handleDeleteIp = async (id: string) => {
    const result = await deleteAllowedIp(id)
    if (result.success) {
      setAllowedIps(allowedIps.filter((ip) => ip.id !== id))
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handleRunMigration = async (version: string) => {
    setIsMigrating(true)
    toast.info(`Running migration for ${version}...`)
    const result = await runSchemaMigration(version)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
    setIsMigrating(false)
  }

  const availableMigrations = [
    "v2",
    "v3",
    "v4",
    "v5",
    "v6",
    "v7",
    "v8",
    "v9",
    "v10",
    "v11",
    "v12",
    "v13",
    "v14",
    "v15",
    "v16",
    "v17",
    "v18",
    "v19",
    "v20",
    "v21",
    "v22",
    "v23",
  ].map((v) => `update-schema-${v}.sql`)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>IP Access Control</CardTitle>
          <CardDescription>Manage IP addresses that are allowed to access the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter new IP address"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              disabled={isAdding}
            />
            <Button onClick={handleAddIp} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add IP"}
            </Button>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Added At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowedIps.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-medium">{ip.ip_address}</TableCell>
                    <TableCell>{new Date(ip.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteIp(ip.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Database Migrations</CardTitle>
          <CardDescription>Run schema updates on your database. Run these in order.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {availableMigrations.map((scriptName) => (
            <Button
              key={scriptName}
              variant="outline"
              onClick={() => handleRunMigration(scriptName)}
              disabled={isMigrating}
            >
              Run {scriptName.match(/v\d+/)?.[0]}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
