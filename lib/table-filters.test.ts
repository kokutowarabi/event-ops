import { describe, expect, it } from "vitest"
import { matchesSelectedValues } from "@/lib/table-filters"

describe("table filters", () => {
  it("matches everything when no option is selected", () => {
    expect(matchesSelectedValues(["教室"], [])).toBe(true)
  })

  it("matches any selected option within a column", () => {
    expect(matchesSelectedValues(["星浜大学 科学探究会"], ["写真部", "科学探究会"])).toBe(true)
    expect(matchesSelectedValues(["星浜大学 科学探究会"], ["写真部", "演劇部"])).toBe(false)
  })

  it("matches without case sensitivity", () => {
    expect(matchesSelectedValues(["Sunset A Cappella Live"], ["a cappella"])).toBe(true)
  })
})
