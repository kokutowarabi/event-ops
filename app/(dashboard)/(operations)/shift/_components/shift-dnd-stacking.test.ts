import { describe, expect, it } from "vitest"
import {
  getShiftBlockStackClass,
  getShiftRowStackClass,
} from "./shift-dnd-stacking"

describe("shift drag stacking", () => {
  it("raises only an actively dragged shift", () => {
    expect(getShiftBlockStackClass(true)).toBe("z-50")
    expect(getShiftBlockStackClass(false)).toBe("")
  })

  it("raises an active member row above sticky headers and member cells", () => {
    expect(getShiftRowStackClass(false, true)).toBe("relative z-40")
    expect(getShiftRowStackClass(true, true)).toContain("z-40")
  })

  it("keeps an idle pinned row at its normal stacking level", () => {
    expect(getShiftRowStackClass(true, false)).toContain("z-15")
  })
})
