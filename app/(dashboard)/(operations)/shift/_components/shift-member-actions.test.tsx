import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ShiftMemberActions } from "./shift-member-actions"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function useDesktopViewport(desktop = true) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: desktop }))
}

describe("shift member actions", () => {
  it("opens an ellipsis card and pins the member", () => {
    useDesktopViewport()
    const onTogglePin = vi.fn()
    const onMemoChange = vi.fn()
    const { container } = render(
      <ShiftMemberActions
        memberName="田中 太郎"
        memo=""
        pinned={false}
        onTogglePin={onTogglePin}
        onMemoChange={onMemoChange}
      />,
    )

    expect(container.querySelector(".lucide-circle-ellipsis")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "田中 太郎の操作" }))
    expect(screen.getByRole("dialog", { name: "田中 太郎の操作" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "固定する" }))

    expect(onTogglePin).toHaveBeenCalledOnce()
  })

  it("shows an editable memo input as soon as the card opens", () => {
    useDesktopViewport()
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

  it("opens on hover and stays open while the pointer moves into the card", () => {
    useDesktopViewport()
    vi.useFakeTimers()
    render(
      <ShiftMemberActions
        memberName="田中 太郎"
        memo=""
        pinned={false}
        onTogglePin={vi.fn()}
        onMemoChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole("button", { name: "田中 太郎の操作" })
    fireEvent.pointerEnter(trigger.parentElement!)
    const card = screen.getByRole("dialog", { name: "田中 太郎の操作" })

    fireEvent.pointerLeave(trigger.parentElement!)
    fireEvent.pointerEnter(card)
    act(() => vi.advanceTimersByTime(150))
    expect(screen.getByRole("dialog", { name: "田中 太郎の操作" })).toBeTruthy()

    fireEvent.pointerLeave(card)
    act(() => vi.advanceTimersByTime(150))
    expect(screen.queryByRole("dialog", { name: "田中 太郎の操作" })).toBeNull()
  })

  it("keeps the card open on mobile until its close button is pressed", () => {
    useDesktopViewport(false)
    render(
      <ShiftMemberActions
        memberName="田中 太郎"
        memo=""
        pinned={false}
        onTogglePin={vi.fn()}
        onMemoChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole("button", { name: "田中 太郎の操作" })
    fireEvent.pointerEnter(trigger.parentElement!)
    expect(screen.queryByRole("dialog", { name: "田中 太郎の操作" })).toBeNull()

    fireEvent.click(trigger)
    const card = screen.getByRole("dialog", { name: "田中 太郎の操作" })
    expect(screen.queryByText("メンバー操作")).toBeNull()
    fireEvent.pointerLeave(trigger.parentElement!)
    fireEvent.pointerLeave(card)
    expect(screen.getByRole("dialog", { name: "田中 太郎の操作" })).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "田中 太郎の操作を閉じる" }))
    expect(screen.queryByRole("dialog", { name: "田中 太郎の操作" })).toBeNull()
  })
})
