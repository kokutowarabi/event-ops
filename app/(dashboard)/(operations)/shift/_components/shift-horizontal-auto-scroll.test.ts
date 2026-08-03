import { describe, expect, it } from "vitest"
import { getHorizontalAutoScrollDelta } from "./shift-horizontal-auto-scroll"

describe("horizontal shift resize auto-scroll", () => {
  const bounds = { left: 100, right: 900 }

  it("does not scroll away from the viewport edges", () => {
    expect(getHorizontalAutoScrollDelta(500, bounds)).toBe(0)
    expect(getHorizontalAutoScrollDelta(100, { left: 100, right: 100 })).toBe(0)
  })

  it("scrolls left faster as the pointer approaches the left edge", () => {
    expect(getHorizontalAutoScrollDelta(150, bounds)).toBe(-6)
    expect(getHorizontalAutoScrollDelta(100, bounds)).toBe(-18)
  })

  it("scrolls right faster as the pointer approaches the right edge", () => {
    expect(getHorizontalAutoScrollDelta(850, bounds)).toBe(6)
    expect(getHorizontalAutoScrollDelta(900, bounds)).toBe(18)
  })
})
