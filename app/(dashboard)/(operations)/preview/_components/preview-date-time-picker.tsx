import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimeWheelColumns } from "@/components/common/time-wheel-picker"
import { cn } from "@/lib/utils"

const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

type PreviewDateTimePickerProps = {
  value: string
  onChange: (value: string) => void
}

function parseValue(value: string) {
  const [datePart, timePart = "00:00"] = value.split("T")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour = "00", minute = "00"] = timePart.split(":")
  return {
    date: new Date(year, month - 1, day),
    datePart,
    hour,
    minute,
  }
}

function formatDateTime(value: string) {
  const { date, hour, minute } = parseValue(value)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${hour}:${minute}`
}

function formatDate(year: number, month: number, day: number) {
  return [year, month + 1, day]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
    .join("-")
}

export function PreviewDateTimePicker({ value, onChange }: PreviewDateTimePickerProps) {
  const selected = parseValue(value)
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selected.date.getFullYear(), selected.date.getMonth(), 1),
  )
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstWeekDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const changeMonth = (offset: number) => {
    setVisibleMonth(new Date(year, month + offset, 1))
  }

  const updateTime = (time: string) => {
    onChange(`${selected.datePart}T${time}`)
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          setVisibleMonth(new Date(selected.date.getFullYear(), selected.date.getMonth(), 1))
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start bg-white"
            aria-label="プレビュー日時を変更"
          />
        }
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        {formatDateTime(value)}
      </PopoverTrigger>
      <PopoverContent
        role="dialog"
        aria-label="プレビュー日時を選択"
        align="end"
        className="w-72 p-3"
      >
        <div className="flex items-center justify-between">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="前の月"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold" aria-live="polite">
            {year}年{month + 1}月
          </p>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="次の月"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-7 text-center text-xs text-muted-foreground">
          {weekDays.map((weekDay) => <span key={weekDay} className="py-1">{weekDay}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstWeekDay }, (_, index) => (
            <span key={`empty-${index}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1
            const datePart = formatDate(year, month, day)
            const isSelected = datePart === selected.datePart
            return (
              <button
                key={datePart}
                type="button"
                aria-label={`${year}年${month + 1}月${day}日を選択`}
                aria-pressed={isSelected}
                onClick={() => onChange(`${datePart}T${selected.hour}:${selected.minute}`)}
                className={cn(
                  "grid aspect-square cursor-pointer place-items-center rounded-md text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                )}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">時刻</p>
          <TimeWheelColumns
            value={`${selected.hour}:${selected.minute}`}
            onChange={updateTime}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
