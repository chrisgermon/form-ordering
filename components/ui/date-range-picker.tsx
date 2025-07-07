"use client"

import type * as React from "react"
import { addDays, format, startOfWeek, endOfWeek } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({ className, date, onDateChange }: DateRangePickerProps) {
  const setDate = onDateChange

  const setToday = () => {
    const today = new Date()
    setDate({ from: today, to: today })
  }

  const setYesterday = () => {
    const yesterday = addDays(new Date(), -1)
    setDate({ from: yesterday, to: yesterday })
  }

  const setThisWeek = () => {
    const today = new Date()
    setDate({ from: startOfWeek(today), to: endOfWeek(today) })
  }

  return (
    <div className={cn("grid gap-2 w-[260px]", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}
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
          <div className="flex items-center justify-start p-2 space-x-1">
            <Button variant="ghost" size="sm" onClick={setToday}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={setYesterday}>
              Yesterday
            </Button>
            <Button variant="ghost" size="sm" onClick={setThisWeek}>
              This Week
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setDate(undefined)}>
              Clear
            </Button>
          </div>
          <Separator />
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
