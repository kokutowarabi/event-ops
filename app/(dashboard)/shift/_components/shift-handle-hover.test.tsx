import { afterEach, describe, expect, it } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { getShiftHoverOwnerId, useShiftHandleHover } from "./shift-handle-hover"

afterEach(cleanup)

function HoverHarness({ shiftId }: { shiftId: string }) {
  const hover = useShiftHandleHover(shiftId)
  return (
    <div>
      <div
        data-testid={`${shiftId}-block`}
        data-shift-block-id={shiftId}
        onPointerOver={hover.onPointerOver}
        onPointerOut={hover.onPointerOut}
      >
        {hover.hovered ? "visible" : "hidden"}
      </div>
      <span
        data-testid={`${shiftId}-handle`}
        data-shift-handle-for={shiftId}
        onPointerOver={hover.onPointerOver}
        onPointerOut={hover.onPointerOut}
      />
    </div>
  )
}

describe("shift handle hover ownership", () => {
  it("finds the owning shift from blocks and nested handle icons", () => {
    const handle = document.createElement("span")
    handle.dataset.shiftHandleFor = "shift-a"
    const icon = document.createElement("svg")
    handle.append(icon)

    expect(getShiftHoverOwnerId(icon)).toBe("shift-a")
    expect(getShiftHoverOwnerId(document.body)).toBeNull()
  })

  it("keeps the source handles visible until the pointer leaves its handle", () => {
    render(
      <>
        <HoverHarness shiftId="shift-a" />
        <HoverHarness shiftId="shift-b" />
      </>,
    )
    const sourceBlock = screen.getByTestId("shift-a-block")
    const sourceHandle = screen.getByTestId("shift-a-handle")
    const targetBlock = screen.getByTestId("shift-b-block")

    fireEvent.pointerOver(sourceBlock)
    expect(sourceBlock.textContent).toBe("visible")

    fireEvent.pointerOut(sourceBlock, { relatedTarget: sourceHandle })
    fireEvent.pointerOver(sourceHandle)
    expect(sourceBlock.textContent).toBe("visible")
    expect(targetBlock.textContent).toBe("hidden")

    fireEvent.pointerOut(sourceHandle, { relatedTarget: targetBlock })
    fireEvent.pointerOver(targetBlock)
    expect(sourceBlock.textContent).toBe("hidden")
    expect(targetBlock.textContent).toBe("visible")
  })
})
