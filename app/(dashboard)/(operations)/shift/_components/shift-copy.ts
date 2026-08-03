import type { Shift } from "@/lib/shift-data"
import { canPlaceShift } from "./shift-placement"

export function copyShiftForMember(shift: Shift, memberId: string, id: string): Shift {
  return { ...shift, id, memberId }
}

export function canCopyShiftToMember(
  shifts: Shift[],
  sourceShift: Shift,
  memberId: string,
) {
  return memberId !== sourceShift.memberId
    && canPlaceShift(
      shifts,
      memberId,
      sourceShift.date,
      sourceShift.start,
      sourceShift.end,
      sourceShift.id,
    )
}

export type VerticalCopyPlan = {
  includedMemberIds: string[]
  targetMemberIds: string[]
  blockedMemberId: string | null
}

export function getVerticalCopyPlan(
  shifts: Shift[],
  sourceShift: Shift,
  orderedMemberIds: string[],
  destinationMemberId: string,
): VerticalCopyPlan {
  const sourceIndex = orderedMemberIds.indexOf(sourceShift.memberId)
  const destinationIndex = orderedMemberIds.indexOf(destinationMemberId)
  if (sourceIndex < 0 || destinationIndex < 0) {
    return {
      includedMemberIds: [sourceShift.memberId],
      targetMemberIds: [],
      blockedMemberId: null,
    }
  }

  const includedMemberIds = [sourceShift.memberId]
  const targetMemberIds: string[] = []
  const direction = destinationIndex >= sourceIndex ? 1 : -1

  for (
    let index = sourceIndex + direction;
    direction > 0 ? index <= destinationIndex : index >= destinationIndex;
    index += direction
  ) {
    const memberId = orderedMemberIds[index]
    const overlappingShifts = shifts.filter(
      (shift) =>
        shift.memberId === memberId
        && shift.date === sourceShift.date
        && shift.start < sourceShift.end
        && shift.end > sourceShift.start,
    )
    const hasDifferentOverlap = overlappingShifts.some(
      (shift) => !hasSameShiftContents(shift, sourceShift),
    )
    if (hasDifferentOverlap) {
      return { includedMemberIds, targetMemberIds, blockedMemberId: memberId }
    }

    includedMemberIds.push(memberId)
    if (overlappingShifts.length === 0) targetMemberIds.push(memberId)
  }

  return { includedMemberIds, targetMemberIds, blockedMemberId: null }
}

export function hasSameShiftContents(left: Shift, right: Shift) {
  return (
    left.date === right.date
    && left.start === right.start
    && left.end === right.end
    && left.templateId === right.templateId
    && left.kind === right.kind
    && left.note === right.note
  )
}

export function orderMemberIdsWithPins(
  scheduledMemberIds: string[],
  filteredMemberIds: string[],
  pinnedMemberIds: string[],
): string[] {
  const scheduled = new Set(scheduledMemberIds)
  const ordered: string[] = []
  const seen = new Set<string>()
  const append = (memberId: string) => {
    if (!scheduled.has(memberId) || seen.has(memberId)) return
    seen.add(memberId)
    ordered.push(memberId)
  }

  pinnedMemberIds.forEach(append)
  filteredMemberIds.forEach(append)
  return ordered
}
