import { describe, expect, it } from "vitest"
import { getResizeDeltaSlots } from "./shift-resize-actions"

describe("shift resize pointer distance", () => {
  it("includes horizontal scrolling after the resize starts", () => {
    expect(getResizeDeltaSlots(700, 700, 160, 0)).toBe(10)
    expect(getResizeDeltaSlots(300, 300, 0, 160)).toBe(-10)
  })

  it("combines pointer movement and scrolling", () => {
    expect(getResizeDeltaSlots(716, 700, 160, 0)).toBe(11)
  })
})
