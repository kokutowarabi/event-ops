import { describe, expect, it } from "vitest"
import { getVerticalAutoScrollDelta } from "./shift-vertical-auto-scroll"

describe("vertical shift drag auto-scroll", () => {
  const bounds = { top: 100, bottom: 700 }

  it("does not scroll away from the viewport edges", () => {
    expect(getVerticalAutoScrollDelta(400, bounds)).toBe(0)
    expect(getVerticalAutoScrollDelta(100, { top: 100, bottom: 100 })).toBe(0)
  })

  it("scrolls upward faster as the pointer approaches the top edge", () => {
    expect(getVerticalAutoScrollDelta(150, bounds)).toBe(-6)
    expect(getVerticalAutoScrollDelta(100, bounds)).toBe(-18)
  })

  it("scrolls downward faster as the pointer approaches the bottom edge", () => {
    expect(getVerticalAutoScrollDelta(650, bounds)).toBe(6)
    expect(getVerticalAutoScrollDelta(700, bounds)).toBe(18)
  })
})
