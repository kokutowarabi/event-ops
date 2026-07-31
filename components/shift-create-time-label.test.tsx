import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ShiftCreateTimeLabel } from "@/components/shift-manager"

afterEach(cleanup)

describe("shift creation preview label", () => {
  it("shows a short range on one line inside the preview", () => {
    render(
      <ShiftCreateTimeLabel start={6 * 60} end={6 * 60 + 15} orientation="horizontal" />,
    )

    const label = screen.getByLabelText("6:00〜6:15")
    expect(label.getAttribute("data-orientation")).toBe("horizontal")
    expect(label.textContent).toBe("6:00〜6:15")
  })

  it("stacks the separator between both times for a narrow timeline", () => {
    render(
      <ShiftCreateTimeLabel start={6 * 60} end={6 * 60 + 15} orientation="vertical" />,
    )

    const label = screen.getByLabelText("6:00〜6:15")
    expect(label.getAttribute("data-orientation")).toBe("vertical")
    expect(
      Array.from(label.children, (child) => child.textContent),
    ).toEqual(["6:00", "〜", "6:15"])
  })
})
