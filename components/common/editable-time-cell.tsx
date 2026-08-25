import { TimeWheelPicker } from "./time-wheel-picker"

type EditableTimeCellProps = {
  value: string
  label: string
  placeholder?: string
  onCommit: (value: string) => void
}

export function EditableTimeCell({
  value,
  label,
  placeholder = "時刻",
  onCommit,
}: EditableTimeCellProps) {
  return (
    <TimeWheelPicker
      value={value || "00:00"}
      label={value ? label : `${placeholder}を入力`}
      className="h-8 w-full justify-center px-1 text-xs"
      onChange={onCommit}
    />
  )
}
