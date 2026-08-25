import { Label } from "@/components/ui/label"
import { TimeWheelPicker } from "@/components/common/time-wheel-picker"
import {
  clampShiftEnd,
  END_MINUTES,
  formatTime,
  parseTime,
  SLOT_MINUTES,
  START_MINUTES,
} from "./shift-domain"

type ShiftTimeFieldsProps = {
  start: number
  end: number
  onChange: (time: { start: number; end: number }) => void
}

export function ShiftTimeFields({
  start,
  end,
  onChange,
}: ShiftTimeFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label>開始</Label>
        <TimeWheelPicker
          value={formatTime(start)}
          label="開始時刻"
          minMinutes={START_MINUTES}
          maxMinutes={END_MINUTES - SLOT_MINUTES}
          minuteStep={SLOT_MINUTES}
          className="w-full"
          onChange={(value) => {
            const nextStart = parseTime(value)
            onChange({
              start: nextStart,
              end: clampShiftEnd(
                Math.max(end, nextStart + SLOT_MINUTES),
                nextStart,
              ),
            })
          }}
        />
      </div>
      <div className="grid gap-1.5">
        <Label>終了</Label>
        <TimeWheelPicker
          value={formatTime(end)}
          label="終了時刻"
          minMinutes={START_MINUTES + SLOT_MINUTES}
          maxMinutes={END_MINUTES}
          minuteStep={SLOT_MINUTES}
          className="w-full"
          onChange={(value) => onChange({ start, end: clampShiftEnd(parseTime(value), start) })}
        />
      </div>
    </div>
  )
}
