import { END_MINUTES, SLOT_MINUTES, START_MINUTES } from "./shift-domain"
import type { ResizeEdge } from "./shift-types"

type ShiftRange = {
  start: number
  end: number
}

export function getResizedShiftRange(
  range: ShiftRange,
  edge: ResizeEdge,
  deltaMinutes: number,
): ShiftRange {
  if (edge === "start") {
    const start = Math.min(
      Math.max(range.start + deltaMinutes, START_MINUTES),
      END_MINUTES - SLOT_MINUTES,
    )
    return { start, end: Math.max(range.end, start + SLOT_MINUTES) }
  }

  const end = Math.max(
    Math.min(range.end + deltaMinutes, END_MINUTES),
    START_MINUTES + SLOT_MINUTES,
  )
  return { start: Math.min(range.start, end - SLOT_MINUTES), end }
}
