"use client"

import { useFormStatus } from "react-dom"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface SubmitButtonProps extends ButtonProps {
  isPending?: boolean
}

export function SubmitButton({ children, isPending, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const showPending = isPending !== undefined ? isPending : pending

  return (
    <Button type="submit" disabled={showPending} {...props}>
      {showPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  )
}
