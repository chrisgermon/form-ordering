"use client"

import { useState } from "react"
import DatePickerComponent from "react-datepicker"
import type { DateRange } from "react-day-picker"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface DateRangePickerProps {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ date, onDateChange, className }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | null>(date?.from || null)
  const [endDate, setEndDate] = useState<Date | null>(date?.to || null)

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    if (start && end) {
      onDateChange({ from: start, to: end })
    } else if (!start && !end) {
      onDateChange(undefined)
    } else {
      onDateChange({ from: start || undefined, to: end || undefined })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={`w-[260px] justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <DatePickerComponent
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateChange}
          monthsShown={2}
          inline
        />
      </PopoverContent>
    </Popover>
  )
}
