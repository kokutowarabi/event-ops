import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ShiftDesktopTimelineHeader } from "./shift-desktop-timeline-header"

afterEach(cleanup)

function renderHeader(hoveredSlot: number) {
  render(
    <ShiftDesktopTimelineHeader
      filterSummary=""
      filtersOpen={false}
      hoveredSlot={{ memberId: "member-a", slot: hoveredSlot }}
      creatingShift={null}
      moving={null}
      resizing={null}
      onToggleFilters={vi.fn()}
    />,
  )
}

describe("shift desktop timeline header", () => {
  it("hides a major label while a slot within thirty minutes is hovered", () => {
    renderHeader(1)

    expect(screen.getByText("6:00").classList.contains("opacity-0")).toBe(true)
    expect(screen.getByText("6:15").classList.contains("opacity-100")).toBe(true)
  })

  it("keeps a major label visible beyond the thirty-minute range", () => {
    renderHeader(3)

    expect(screen.getByText("6:00").classList.contains("opacity-100")).toBe(true)
  })
})
