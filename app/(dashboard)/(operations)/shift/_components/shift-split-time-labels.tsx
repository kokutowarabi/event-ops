import { formatTime } from "./shift-domain"

type ShiftSplitTimeLabelsProps = {
  start: number
  end: number
}

export function ShiftSplitTimeLabels({
  start,
  end,
}: ShiftSplitTimeLabelsProps) {
  return (
    <>
      <span className="absolute bottom-full right-full mr-2 whitespace-nowrap text-sm font-medium">
        {formatTime(start)}
      </span>
      <span className="absolute bottom-full left-full ml-2 whitespace-nowrap text-sm font-medium">
        {formatTime(end)}
      </span>
    </>
  )
}
