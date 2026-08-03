import type { Shift } from "@/lib/shift-data"
import type { MovingShift } from "./shift-types"

export function isMovingPreviewVisibleForMember(
  moving: MovingShift | null,
  memberId: string,
) {
  return Boolean(moving?.canDrop && moving.previewMemberId === memberId)
}

export function getMovingPreviewForMember(
  moving: MovingShift | null,
  movingShift: Shift | null,
  memberId: string,
) {
  if (
    !movingShift
    || !isMovingPreviewVisibleForMember(moving, memberId)
    || movingShift.memberId === memberId
  ) {
    return null
  }

  return {
    ...movingShift,
    memberId,
    start: moving.previewStart,
    end: moving.previewEnd,
  }
}
