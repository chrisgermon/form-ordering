import { signIn } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel.
            <br />
            Use <strong>admin@example.com</strong> and password <strong>admin</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                defaultValue="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required defaultValue="admin" />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
            {searchParams?.message && (
              <p className="mt-4 p-4 bg-red-100 text-red-700 text-center rounded-md">{searchParams.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
