"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addAllowedIp, deleteAllowedIp, runSchemaMigration } from "./actions"
import type { AllowedIp } from "@/lib/types"
import { toast } from "sonner"

export function SystemActions({
  allowedIps: initialAllowedIps,
  scriptFiles,
}: {
  allowedIps: AllowedIp[]
  scriptFiles: string[]
}) {
  const [allowedIps, setAllowedIps] = useState(initialAllowedIps)
  const [newIp, setNewIp] = useState("")

  const handleAddIp = async () => {
    const result = await addAllowedIp(newIp)
    if (result.success) {
      toast.success(result.message)
      setAllowedIps([...allowedIps, result.data!])
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

  const handleRunMigration = async (scriptName: string) => {
    if (window.confirm(`Are you sure you want to run the migration script: ${scriptName}?`)) {
      const result = await runSchemaMigration(scriptName)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
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
          <div className="flex space-x-2">
            <Input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="Enter new IP address" />
            <Button onClick={handleAddIp}>Add IP</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allowedIps.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell>{ip.ip_address}</TableCell>
                  <TableCell>{new Date(ip.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteIp(ip.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Database Migrations</CardTitle>
          <CardDescription>Run SQL migration scripts.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {scriptFiles.map((script) => (
              <li key={script} className="flex justify-between items-center">
                <span>{script}</span>
                <Button size="sm" onClick={() => handleRunMigration(script)}>
                  Run
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
