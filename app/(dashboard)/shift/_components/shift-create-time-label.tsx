import { formatTime } from "./shift-domain"

export function ShiftCreateTimeLabel({
  start,
  end,
  orientation,
}: {
  start: number
  end: number
  orientation: "horizontal" | "vertical"
}) {
  const startLabel = formatTime(start)
  const endLabel = formatTime(end)
  const label = `${startLabel}〜${endLabel}`

  if (orientation === "vertical") {
    return (
      <span
        data-orientation="vertical"
        className="flex w-max shrink-0 flex-col items-center text-xs font-medium leading-3"
        aria-label={label}
      >
        <span aria-hidden="true">{startLabel}</span>
        <span aria-hidden="true">〜</span>
        <span aria-hidden="true">{endLabel}</span>
      </span>
    )
  }

  return (
    <span
      data-orientation="horizontal"
      className="inline-flex w-max items-center whitespace-nowrap text-xs font-medium"
      aria-label={label}
    >
      {label}
    </span>
  )
}
