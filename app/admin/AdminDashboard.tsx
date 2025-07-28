"use client"

import type { Brand, Submission } from "@/lib/types"
import SubmissionsTable from "./SubmissionsTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/login/actions"

interface AdminDashboardProps {
  brands: Brand[]
  submissions: Submission[]
}

export default function AdminDashboard({ brands = [], submissions = [] }: AdminDashboardProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <form action={signOut} className="ml-auto">
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionsTable submissions={submissions} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
