import { describe, expect, it } from "vitest"
import {
  adjustConflictingShiftRanges,
  canPlaceShift,
  copyShiftForMember,
  createShiftTemplateColor,
  fitShiftIntoAvailableRange,
  getCreateShiftTimeRange,
  getNearestTimelineMajorSlots,
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

  it("shrinks a moving shift to the longest free range before an overlap", () => {
    expect(
      fitShiftIntoAvailableRange(
        shifts,
        "member-b",
        "2026-10-31",
        9 * 60,
        11 * 60,
        "source",
      ),
    ).toEqual({ start: 9 * 60, end: 10 * 60, wasShrunk: true })
  })

  it("shrinks a moving shift to the free range after an overlap", () => {
    expect(
      fitShiftIntoAvailableRange(
        shifts,
        "member-b",
        "2026-10-31",
        10 * 60,
        12 * 60,
        "source",
      ),
    ).toEqual({ start: 11 * 60, end: 12 * 60, wasShrunk: true })
  })

  it("rejects a move when the candidate range has no free slot", () => {
    expect(
      fitShiftIntoAvailableRange(
        shifts,
        "member-b",
        "2026-10-31",
        10 * 60,
        10 * 60 + 30,
        "source",
      ),
    ).toBeNull()
  })

  it("copies a shift to another member without changing its contents", () => {
    expect(copyShiftForMember(shifts[0], "member-c", "copy-id")).toEqual({
      ...shifts[0],
      id: "copy-id",
      memberId: "member-c",
    })
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

  it("rejects conflict adjustment when no fifteen-minute target range remains", () => {
    expect(
      adjustConflictingShiftRanges(
        shifts,
        "member-b",
        "2026-10-31",
        9 * 60,
        12 * 60,
        "source",
      ),
    ).toBeNull()
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

  it("fades only the nearest major tick for a nearby hover", () => {
    expect(getNearestTimelineMajorSlots(1)).toEqual([0])
  })

  it("fades both surrounding major ticks for a midpoint hover", () => {
    expect(getNearestTimelineMajorSlots(4)).toEqual([0, 8])
  })

  it("splits time labels only below seventy-five minutes", () => {
    expect(shouldSplitShiftTimeLabels(6 * 60, 7 * 60)).toBe(true)
    expect(shouldSplitShiftTimeLabels(6 * 60, 7 * 60 + 15)).toBe(false)
  })
})
