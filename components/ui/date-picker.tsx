"use client"

import React from "react"
import DatePickerComponent from "react-datepicker"
import { CalendarIcon } from "lucide-react"

interface DatePickerProps {
  value: Date | null | undefined
  onChange: (date: Date | null) => void
  className?: string
  placeholder?: string
}

const CustomInput = React.forwardRef<HTMLInputElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <div className="relative w-full">
      <input onClick={onClick} ref={ref} value={value} placeholder={placeholder} readOnly className="cursor-pointer" />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  ),
)
CustomInput.displayName = "CustomInput"

export function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  return (
    <DatePickerComponent
      selected={value}
      onChange={onChange}
      placeholderText={placeholder}
      dateFormat="PPP"
      customInput={<CustomInput />}
    />
  )
}
