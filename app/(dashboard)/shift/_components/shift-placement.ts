import type { Shift } from "@/lib/shift-data"
import { END_MINUTES, SLOT_MINUTES, START_MINUTES } from "./shift-time"

export type ShiftAdjustmentChange = {
  before: Shift
  after: Shift | null
}

export function shiftsEqual(left: Shift[], right: Shift[]) {
  if (left.length !== right.length) return false
  return left.every((shift, index) => {
    const next = right[index]
    return (
      shift.id === next.id
      && shift.memberId === next.memberId
      && shift.date === next.date
      && shift.start === next.start
      && shift.end === next.end
      && shift.templateId === next.templateId
      && shift.kind === next.kind
      && shift.note === next.note
    )
  })
}

export function isSlotOccupied(
  shifts: Shift[],
  memberId: string,
  date: string,
  slot: number,
  ignoreShiftId?: string,
) {
  const slotStart = START_MINUTES + slot * SLOT_MINUTES
  const slotEnd = slotStart + SLOT_MINUTES
  return shifts.some(
    (shift) =>
      shift.id !== ignoreShiftId
      && shift.memberId === memberId
      && shift.date === date
      && shift.start < slotEnd
      && shift.end > slotStart,
  )
}

export function canPlaceShift(
  shifts: Shift[],
  memberId: string,
  date: string,
  start: number,
  end: number,
  ignoreShiftId: string,
) {
  if (start < START_MINUTES || end > END_MINUTES || end <= start) return false
  return !shifts.some(
    (shift) =>
      shift.id !== ignoreShiftId
      && shift.memberId === memberId
      && shift.date === date
      && shift.start < end
      && shift.end > start,
  )
}

export function adjustConflictingShiftRanges(
  shifts: Shift[],
  memberId: string,
  date: string,
  start: number,
  end: number,
  ignoreShiftId?: string,
) {
  if (start < START_MINUTES || end > END_MINUTES || end <= start) return null

  const adjustedShiftIds: string[] = []
  const removedShiftIds: string[] = []
  const adjustedShifts = shifts.flatMap((shift) => {
    const conflicts =
      shift.id !== ignoreShiftId
      && shift.memberId === memberId
      && shift.date === date
      && shift.start < end
      && shift.end > start
    if (!conflicts) return [shift]

    const leftDuration = start - shift.start
    const rightDuration = shift.end - end
    const canKeepLeft = leftDuration >= SLOT_MINUTES
    const canKeepRight = rightDuration >= SLOT_MINUTES
    adjustedShiftIds.push(shift.id)
    if (!canKeepLeft && !canKeepRight) {
      removedShiftIds.push(shift.id)
      return []
    }

    return [
      canKeepLeft && (!canKeepRight || leftDuration >= rightDuration)
        ? { ...shift, end: start }
        : { ...shift, start: end },
    ]
  })

  return { shifts: adjustedShifts, adjustedShiftIds, removedShiftIds }
}

export function getShiftAdjustmentChanges(
  beforeShifts: Shift[],
  afterShifts: Shift[],
  ignoreShiftId?: string,
): ShiftAdjustmentChange[] {
  const afterById = new Map(afterShifts.map((shift) => [shift.id, shift]))
  return beforeShifts.flatMap((before) => {
    if (before.id === ignoreShiftId) return []
    const after = afterById.get(before.id) ?? null
    if (after && after.start === before.start && after.end === before.end) return []
    return [{ before, after }]
  })
}
