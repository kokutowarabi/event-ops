import { describe, expect, it } from "vitest"
import type { Shift } from "@/lib/shift-data"
import {
  getMovingPreviewForMember,
  isMovingPreviewVisibleForMember,
} from "./shift-move-preview"
import type { MovingShift } from "./shift-types"

const moving: MovingShift = {
  id: "shift-a",
  originX: 0,
  pointerOffsetX: 0,
  pointerX: 0,
  pointerY: 0,
  start: 9 * 60,
  end: 10 * 60,
  previewStart: 11 * 60,
  previewEnd: 12 * 60,
  previewMemberId: "member-b",
  canDrop: true,
}

const movingShift: Shift = {
  id: "shift-a",
  memberId: "member-a",
  date: "2026-10-26",
  start: 6 * 60,
  end: 7 * 60,
  templateId: "unassigned",
  kind: "day",
  note: "",
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

  it("uses the pointer preview range instead of a reset source range", () => {
    expect(getMovingPreviewForMember(moving, movingShift, "member-b")).toMatchObject({
      memberId: "member-b",
      start: 11 * 60,
      end: 12 * 60,
    })
  })

  it("does not create a shadow over a conflicting shift", () => {
    expect(
      getMovingPreviewForMember(
        { ...moving, canDrop: false },
        movingShift,
        "member-b",
      ),
    ).toBeNull()
  })
})
