import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ShiftMemberActions } from "./shift-member-actions"

afterEach(cleanup)

describe("shift member actions", () => {
  it("opens an ellipsis card and pins the member", () => {
    const onTogglePin = vi.fn()
    render(
      <ShiftMemberActions
        memberName="田中 太郎"
        pinned={false}
        onTogglePin={onTogglePin}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "田中 太郎の操作" }))
    expect(screen.getByRole("dialog", { name: "田中 太郎の操作" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "固定する" }))

    expect(onTogglePin).toHaveBeenCalledOnce()
  })
})
