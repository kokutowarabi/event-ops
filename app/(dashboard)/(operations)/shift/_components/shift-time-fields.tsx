import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  clampShiftEnd,
  formatTime,
  parseTime,
  SLOT_MINUTES,
  timeOptions,
} from "./shift-domain"

type ShiftTimeFieldsProps = {
  start: number
  end: number
  onChange: (time: { start: number; end: number }) => void
  keyPrefix: string
}

export function ShiftTimeFields({
  start,
  end,
  onChange,
  keyPrefix,
}: ShiftTimeFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label>開始</Label>
        <Select
          value={formatTime(start)}
          onValueChange={(value) => {
            if (value === null) return
            const nextStart = parseTime(value)
            onChange({
              start: nextStart,
              end: clampShiftEnd(
                Math.max(end, nextStart + SLOT_MINUTES),
                nextStart,
              ),
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{formatTime(start)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.slice(0, -1).map((option) => (
              <SelectItem key={`${keyPrefix}-start-${option.value}`} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>終了</Label>
        <Select
          value={formatTime(end)}
          onValueChange={(value) => {
            if (value === null) return
            onChange({ start, end: clampShiftEnd(parseTime(value), start) })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{formatTime(end)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.slice(1).map((option) => (
              <SelectItem key={`${keyPrefix}-end-${option.value}`} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
