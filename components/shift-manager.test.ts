import { describe, expect, it } from "vitest"
import {
  adjustConflictingShiftRanges,
  canCopyShiftToMember,
  canPlaceShift,
  copyShiftForMember,
  createShiftTemplateColor,
  getCreateShiftTimeRange,
  getShiftAdjustmentChanges,
  getShiftDetailPosition,
  getNearestVerticalRectIndex,
  shouldSplitShiftTimeLabels,
  type Shift,
} from "@/components/shift-manager"

const shifts: Shift[] = [
  {
    id: "source",
    memberId: "member-a",
    date: "2026-10-31",
    start: 9 * 60,
    end: 10 * 60,
    templateId: "guide",
    kind: "day",
    note: "",
  },
  {
    id: "target-existing",
    memberId: "member-b",
    date: "2026-10-31",
    start: 10 * 60,
    end: 11 * 60,
    templateId: "reception",
    kind: "morning",
    note: "",
  },
]

describe("shift placement", () => {
  it("rejects a move to another member when it overlaps", () => {
    expect(
      canPlaceShift(shifts, "member-b", "2026-10-31", 10 * 60, 11 * 60, "source"),
    ).toBe(false)
  })

  it("allows a move to another member when the destination is free", () => {
    expect(
      canPlaceShift(shifts, "member-b", "2026-10-31", 11 * 60, 12 * 60, "source"),
    ).toBe(true)
  })

  it("copies a shift to another member without changing its contents", () => {
    expect(copyShiftForMember(shifts[0], "member-c", "copy-id")).toEqual({
      ...shifts[0],
      id: "copy-id",
      memberId: "member-c",
    })
  })

  it("copies vertically only to a member without a shift on that date", () => {
    expect(canCopyShiftToMember(shifts, shifts[0], "member-b")).toBe(false)
    expect(canCopyShiftToMember(shifts, shifts[0], "member-c")).toBe(true)
  })

  it("keeps a vertical copy preview active between member rows", () => {
    const rows = [
      { top: 0, bottom: 40 },
      { top: 60, bottom: 100 },
    ]
    expect(getNearestVerticalRectIndex(rows, 45)).toBe(0)
    expect(getNearestVerticalRectIndex(rows, 55)).toBe(1)
  })

  it("shrinks the conflicting shift before a selected range", () => {
    const result = adjustConflictingShiftRanges(
      shifts,
      "member-b",
      "2026-10-31",
      10 * 60 + 30,
      12 * 60,
      "source",
    )

    expect(result?.adjustedShiftIds).toEqual(["target-existing"])
    expect(result?.shifts.find((shift) => shift.id === "target-existing")).toMatchObject({
      start: 10 * 60,
      end: 10 * 60 + 30,
    })
  })

  it("shrinks the conflicting shift after a selected range", () => {
    const result = adjustConflictingShiftRanges(
      shifts,
      "member-b",
      "2026-10-31",
      9 * 60,
      10 * 60 + 30,
      "source",
    )

    expect(result?.shifts.find((shift) => shift.id === "target-existing")).toMatchObject({
      start: 10 * 60 + 30,
      end: 11 * 60,
    })
  })

  it("removes a conflicting shift when no duration remains", () => {
    const result = adjustConflictingShiftRanges(
      shifts,
      "member-b",
      "2026-10-31",
      9 * 60,
      12 * 60,
      "source",
    )

    expect(result?.removedShiftIds).toEqual(["target-existing"])
    expect(result?.shifts.some((shift) => shift.id === "target-existing")).toBe(false)
  })

  it("shrinks and removes multiple shifts across one selected range", () => {
    const before = {
      ...shifts[1],
      id: "target-before",
      start: 9 * 60,
      end: 10 * 60,
    }
    const after = {
      ...shifts[1],
      id: "target-after",
      start: 11 * 60,
      end: 12 * 60,
    }
    const result = adjustConflictingShiftRanges(
      [before, shifts[1], after],
      "member-b",
      "2026-10-31",
      9 * 60 + 30,
      11 * 60 + 30,
    )

    expect(result?.adjustedShiftIds).toEqual(["target-before", "target-existing", "target-after"])
    expect(result?.removedShiftIds).toEqual(["target-existing"])
    expect(result?.shifts).toEqual([
      { ...before, end: 9 * 60 + 30 },
      { ...after, start: 11 * 60 + 30 },
    ])
  })

  it("describes shortened and removed shifts before confirmation", () => {
    const shortened = { ...shifts[1], end: 10 * 60 + 30 }
    expect(getShiftAdjustmentChanges(shifts, [shifts[0], shortened])).toEqual([
      { before: shifts[1], after: shortened },
    ])
    expect(getShiftAdjustmentChanges(shifts, [shifts[0]])).toEqual([
      { before: shifts[1], after: null },
    ])
  })

  it("assigns a distinct color to every built-in business", () => {
    const backgrounds = Array.from(
      { length: 8 },
      (_, index) => createShiftTemplateColor(index).blockStyle.backgroundColor,
    )
    expect(new Set(backgrounds)).toHaveLength(8)
  })

  it("creates a minimum fifteen-minute shift from one slot", () => {
    expect(getCreateShiftTimeRange(0, 0)).toEqual({
      start: 6 * 60,
      end: 6 * 60 + 15,
    })
  })

  it("keeps fifteen-minute slots when dragging backwards", () => {
    expect(getCreateShiftTimeRange(3, 1)).toEqual({
      start: 6 * 60 + 15,
      end: 7 * 60,
    })
  })

  it("splits time labels only below seventy-five minutes", () => {
    expect(shouldSplitShiftTimeLabels(6 * 60, 7 * 60)).toBe(true)
    expect(shouldSplitShiftTimeLabels(6 * 60, 7 * 60 + 15)).toBe(false)
  })
})

describe("shift detail position", () => {
  it("opens to the right when there is enough room", () => {
    expect(
      getShiftDetailPosition({ left: 100, right: 200, top: 50 }, 1000, 800),
    ).toEqual({ left: 208, top: 50, width: 448, maxHeight: 768 })
  })

  it("opens to the left and moves upward near the viewport edges", () => {
    expect(
      getShiftDetailPosition({ left: 900, right: 950, top: 760 }, 1000, 800),
    ).toEqual({ left: 444, top: 224, width: 448, maxHeight: 768 })
  })

  it("fits within a narrow viewport", () => {
    expect(
      getShiftDetailPosition({ left: 100, right: 200, top: 40 }, 320, 600),
    ).toEqual({ left: 16, top: 24, width: 288, maxHeight: 568 })
  })
})
