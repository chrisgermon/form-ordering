"use client"

import type React from "react"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof Button> & {
  children: React.ReactNode
}

export function SubmitButton({ children, ...props }: Props) {
  const { pending } = useFormStatus()

  return (
    <Button {...props} type="submit" disabled={pending || props.disabled}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  )
}
