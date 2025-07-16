"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import type { Instance } from "flatpickr"
import "flatpickr/dist/flatpickr.min.css"
import "@/app/styles/custom-flatpickr.css" // Custom theme
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date | string
  onChange: (date: Date) => void
  placeholder?: string
  className?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder, className }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const fpInstanceRef = useRef<Instance | null>(null)

  useEffect(() => {
    if (!inputRef.current) return

    // Dynamically import flatpickr to ensure it's only loaded on the client
    import("flatpickr").then((flatpickrModule) => {
      const flatpickr = flatpickrModule.default
      if (inputRef.current) {
        const instance = flatpickr(inputRef.current, {
          altInput: true,
          altFormat: "d-m-Y",
          dateFormat: "Y-m-d",
          defaultDate: value ? new Date(value) : undefined,
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              onChange(selectedDates[0])
            }
          },
        })
        fpInstanceRef.current = instance
      }
    })

    return () => {
      if (fpInstanceRef.current) {
        fpInstanceRef.current.destroy()
        fpInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only on mount

  // Effect to update the date when the prop changes from outside
  useEffect(() => {
    if (fpInstanceRef.current && value) {
      fpInstanceRef.current.setDate(new Date(value), false)
    }
  }, [value])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder || "Select a date"}
      className={cn(
        "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
        className,
      )}
    />
  )
}
