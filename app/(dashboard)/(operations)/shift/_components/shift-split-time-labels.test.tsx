import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"
import { ShiftSplitTimeLabels } from "./shift-split-time-labels"

afterEach(cleanup)

describe("split shift time labels", () => {
  it("aligns label bottoms to the shift top edge for every interaction", () => {
    const { container } = render(<ShiftSplitTimeLabels start={360} end={390} />)

    for (const label of container.querySelectorAll("span")) {
      expect(label.classList.contains("bottom-full")).toBe(true)
      expect(label.classList.contains("-top-3")).toBe(false)
    }
  })
})
