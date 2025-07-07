"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addAllowedIp, deleteAllowedIp, runSchemaMigration } from "./actions"
import { toast } from "sonner"
import type { AllowedIp } from "@/lib/types"
import { Trash2 } from "lucide-react"

type SystemActionsProps = {
  allowedIps: AllowedIp[]
  scriptFiles: string[]
}

export function SystemActions({ allowedIps: initialIps, scriptFiles }: SystemActionsProps) {
  const [allowedIps, setAllowedIps] = useState(initialIps)
  const [ipAddress, setIpAddress] = useState("")
  const [selectedScript, setSelectedScript] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  const handleAddIp = async () => {
    if (!ipAddress.trim()) {
      toast.error("IP address cannot be empty.")
      return
    }
    setIsAdding(true)
    const result = await addAllowedIp(ipAddress)
    if (result.success && result.data) {
      setAllowedIps((prev) => [...prev, result.data!])
      toast.success(result.message)
      setIpAddress("")
    } else {
      toast.error(result.message)
    }
    setIsAdding(false)
  }

  const handleDeleteIp = async (id: string) => {
    const result = await deleteAllowedIp(id)
    if (result.success) {
      setAllowedIps((prev) => prev.filter((ip) => ip.id !== id))
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handleRunMigration = async () => {
    if (!selectedScript) {
      toast.error("Please select a migration script to run.")
      return
    }
    if (
      window.confirm(`Are you sure you want to run the script: ${selectedScript}? This can cause irreversible changes.`)
    ) {
      setIsMigrating(true)
      const result = await runSchemaMigration(selectedScript)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      setIsMigrating(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Allowed IP Addresses</CardTitle>
          <CardDescription>Manage IP addresses that can access the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter new IP address"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
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
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteIp(ip.id)}>
                        <Trash2 className="h-4 w-4" />
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
          <CardDescription>Run SQL migration scripts. Use with caution.</CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button onClick={handleRunMigration} variant="destructive" disabled={isMigrating || !selectedScript}>
              {isMigrating ? "Running..." : "Run Script"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
