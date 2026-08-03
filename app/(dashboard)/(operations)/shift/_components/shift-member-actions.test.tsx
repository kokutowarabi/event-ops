import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ShiftMemberActions } from "./shift-member-actions"

afterEach(cleanup)

describe("shift member actions", () => {
  it("opens an ellipsis card and pins the member", () => {
    const onTogglePin = vi.fn()
    const onMemoChange = vi.fn()
    render(
      <ShiftMemberActions
        memberName="田中 太郎"
        memo=""
        pinned={false}
        onTogglePin={onTogglePin}
        onMemoChange={onMemoChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "田中 太郎の操作" }))
    expect(screen.getByRole("dialog", { name: "田中 太郎の操作" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "固定する" }))

    expect(onTogglePin).toHaveBeenCalledOnce()
  })

  it("shows an editable memo input as soon as the card opens", () => {
    const onMemoChange = vi.fn()
    render(
      <ShiftMemberActions
        memberName="田中 太郎"
        memo="引き継ぎ前"
        pinned={false}
        onTogglePin={vi.fn()}
        onMemoChange={onMemoChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "田中 太郎の操作" }))
    const memoInput = screen.getByRole("textbox", { name: "メモ" })
    expect((memoInput as HTMLInputElement).value).toBe("引き継ぎ前")

    fireEvent.change(memoInput, { target: { value: "引き継ぎ済み" } })
    expect(onMemoChange).toHaveBeenCalledWith("引き継ぎ済み")
  })
})
