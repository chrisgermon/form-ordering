"use client"

import { useRef, useEffect } from "react"
import flatpickr from "flatpickr"
import type { Instance } from "flatpickr"
import "flatpickr/dist/flatpickr.css"
import "@/app/styles/custom-flatpickr.css"

import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

interface DatePickerProps {
  value: Date | string | null
  onChange: (date: Date) => void
  className?: string
  placeholder?: string
}

export function DatePicker({ value, onChange, className, placeholder }: DatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const fp = useRef<Instance | null>(null)

  useEffect(() => {
    if (!wrapperRef.current) return

    // Find the input element within the wrapper
    const inputElement = wrapperRef.current.querySelector("input")
    if (!inputElement) return

    fp.current = flatpickr(wrapperRef.current, {
      wrap: true, // Important for positioning icon
      altInput: true,
      altFormat: "d-m-Y", // Display format
      dateFormat: "Y-m-d", // Value format
      defaultDate: value ? new Date(value) : new Date(),
      minDate: "today",
      disableMobile: true,
      onChange: (selectedDates) => {
        if (selectedDates[0]) {
          onChange(selectedDates[0])
        }
      },
    })

    return () => {
      fp.current?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (value && fp.current) {
      fp.current.setDate(value, false)
    }
  }, [value])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        placeholder={placeholder || "Select a date"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        data-input // flatpickr hook to identify the input
      />
      <CalendarIcon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        data-toggle // flatpickr hook to toggle the calendar
      />
    </div>
  )
}
