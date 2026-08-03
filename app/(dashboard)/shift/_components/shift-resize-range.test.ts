import { describe, expect, it } from "vitest"
import { adjustConflictingShiftRanges, type Shift } from "./shift-domain"
import { getResizedShiftRange } from "./shift-resize-range"

const sourceShift: Shift = {
  id: "source",
  memberId: "member-a",
  date: "2026-10-31",
  start: 9 * 60,
  end: 10 * 60,
  templateId: "guide",
  kind: "day",
  note: "",
}

describe("getResizedShiftRange", () => {
  it("pushes the end forward when the start edge crosses it", () => {
    const range = getResizedShiftRange(sourceShift, "start", 75)
    expect(range).toEqual({ start: 10 * 60 + 15, end: 10 * 60 + 30 })

    const nextShift = { ...sourceShift, id: "next", start: 10 * 60 + 15, end: 11 * 60 }
    const result = adjustConflictingShiftRanges(
      [sourceShift, nextShift],
      sourceShift.memberId,
      sourceShift.date,
      range.start,
      range.end,
      sourceShift.id,
    )
    expect(result?.shifts.find((shift) => shift.id === nextShift.id)?.start).toBe(range.end)
  })

  it("pushes the start backward when the end edge crosses it", () => {
    const range = getResizedShiftRange(sourceShift, "end", -75)
    expect(range).toEqual({ start: 8 * 60 + 30, end: 8 * 60 + 45 })

    const previousShift = { ...sourceShift, id: "previous", start: 8 * 60, end: 8 * 60 + 45 }
    const result = adjustConflictingShiftRanges(
      [previousShift, sourceShift],
      sourceShift.memberId,
      sourceShift.date,
      range.start,
      range.end,
      sourceShift.id,
    )
    expect(result?.shifts.find((shift) => shift.id === previousShift.id)?.end).toBe(range.start)
  })

  it("keeps the opposite edge fixed before the handles collide", () => {
    expect(
      getResizedShiftRange({ start: 9 * 60, end: 10 * 60 }, "start", 30),
    ).toEqual({ start: 9 * 60 + 30, end: 10 * 60 })
    expect(
      getResizedShiftRange({ start: 9 * 60, end: 10 * 60 }, "end", -30),
    ).toEqual({ start: 9 * 60, end: 9 * 60 + 30 })
  })
})
