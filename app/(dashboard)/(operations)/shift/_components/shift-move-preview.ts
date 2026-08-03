import type { MovingShift } from "./shift-types"

export function isMovingPreviewVisibleForMember(
  moving: MovingShift | null,
  memberId: string,
) {
  return Boolean(moving?.canDrop && moving.previewMemberId === memberId)
}
