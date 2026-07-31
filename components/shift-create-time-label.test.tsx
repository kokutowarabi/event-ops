import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  ShiftCreateTimeLabel,
  ShiftTimelineRangeMarks,
} from "@/components/shift-manager"

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

describe("shift timeline range marks", () => {
  it("keeps compact times together with a separator", () => {
    render(<ShiftTimelineRangeMarks startSlot={0} endSlot={1} />)

    const marks = screen.getByLabelText("6:00〜6:15")
    expect(marks.getAttribute("data-layout")).toBe("compact")
    expect(marks.textContent).toBe("6:00〜6:15")
  })

  it("places a separator between distributed boundary times", () => {
    render(<ShiftTimelineRangeMarks startSlot={0} endSlot={4} />)

    const marks = screen.getByLabelText("6:00〜7:00")
    expect(marks.getAttribute("data-layout")).toBe("distributed")
    expect(Array.from(marks.children, (child) => child.textContent)).toEqual(["6:00", "〜", "7:00"])
  })
})
