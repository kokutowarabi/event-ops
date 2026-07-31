import { describe, expect, it } from "vitest"
import {
  canPlaceShift,
  createShiftTemplateColor,
  getCreateShiftTimeRange,
  getNearestTimelineMajorSlots,
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
})
