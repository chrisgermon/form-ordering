"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addAllowedIp, deleteAllowedIp, runSchemaMigration } from "./actions"
import type { AllowedIp } from "@/lib/types"

export function SystemActions({
  allowedIps: initialAllowedIps,
  scriptFiles,
}: { allowedIps: AllowedIp[]; scriptFiles: string[] }) {
  const [allowedIps, setAllowedIps] = useState(initialAllowedIps)
  const [newIp, setNewIp] = useState("")
  const [selectedScript, setSelectedScript] = useState<string | undefined>()

  const handleAddIp = async () => {
    const result = await addAllowedIp(newIp)
    if (result.success && result.data) {
      toast.success(result.message)
      setAllowedIps([...allowedIps, result.data])
      setNewIp("")
    } else {
      toast.error(result.message)
    }
  }

  const handleDeleteIp = async (id: string) => {
    const result = await deleteAllowedIp(id)
    if (result.success) {
      toast.success(result.message)
      setAllowedIps(allowedIps.filter((ip) => ip.id !== id))
    } else {
      toast.error(result.message)
    }
  }

  const handleRunMigration = async () => {
    if (!selectedScript) {
      toast.warning("Please select a migration script to run.")
      return
    }
    const result = await runSchemaMigration(selectedScript)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Allowed IP Addresses</CardTitle>
          <CardDescription>Manage IP addresses that can access the admin area.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Enter new IP address" value={newIp} onChange={(e) => setNewIp(e.target.value)} />
            <Button onClick={handleAddIp}>Add IP</Button>
          </div>
          <div className="rounded-md border max-h-60 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowedIps.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell>{ip.ip_address}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteIp(ip.id)}>
                        Delete
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
          <CardDescription>Run SQL migration scripts to update the database schema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select onValueChange={setSelectedScript} value={selectedScript}>
              <SelectTrigger>
                <SelectValue placeholder="Select a script" />
              </SelectTrigger>
              <SelectContent>
                {scriptFiles.map((script) => (
                  <SelectItem key={script} value={script}>
                    {script}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRunMigration}>Run Migration</Button>
          </div>
          <p className="text-sm text-destructive">
            Warning: Running migrations can cause irreversible changes to your database. Proceed with caution.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
