import { describe, expect, it } from "vitest"
import { isMovingPreviewVisibleForMember } from "./shift-move-preview"
import type { MovingShift } from "./shift-types"

const moving: MovingShift = {
  id: "shift-a",
  originX: 0,
  pointerOffsetX: 0,
  pointerX: 0,
  pointerY: 0,
  start: 9 * 60,
  end: 10 * 60,
  previewMemberId: "member-b",
  canDrop: true,
}

describe("moving shift preview", () => {
  it("shows the shadow only on the droppable hovered member", () => {
    expect(isMovingPreviewVisibleForMember(moving, "member-b")).toBe(true)
    expect(isMovingPreviewVisibleForMember(moving, "member-a")).toBe(false)
  })

  it("hides the shadow while the hovered range is blocked", () => {
    expect(
      isMovingPreviewVisibleForMember({ ...moving, canDrop: false }, "member-b"),
    ).toBe(false)
  })
})
