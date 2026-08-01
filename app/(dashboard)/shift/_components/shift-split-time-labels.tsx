import { formatTime } from "./shift-domain"

type ShiftSplitTimeLabelsProps = {
  start: number
  end: number
  alignBottomToTopEdge?: boolean
}

export function ShiftSplitTimeLabels({
  start,
  end,
  alignBottomToTopEdge = false,
}: ShiftSplitTimeLabelsProps) {
  const verticalPosition = alignBottomToTopEdge
    ? "bottom-[calc(100%+1px)]"
    : "-top-3"

  return (
    <>
      <span className={`absolute ${verticalPosition} right-full mr-2 whitespace-nowrap text-sm font-medium`}>
        {formatTime(start)}
      </span>
      <span className={`absolute ${verticalPosition} left-full ml-2 whitespace-nowrap text-sm font-medium`}>
        {formatTime(end)}
      </span>
    </>
  )
}
