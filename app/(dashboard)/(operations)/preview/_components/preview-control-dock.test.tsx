import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PreviewControlDock } from "./preview-control-dock"

afterEach(cleanup)

function renderDock() {
  const onPreviewDateTimeChange = vi.fn()
  const onUseCurrentDateTime = vi.fn()
  const view = render(
    <PreviewControlDock
      previewDateTime="2026-10-31T12:00"
      onPreviewDateTimeChange={onPreviewDateTimeChange}
      onUseCurrentDateTime={onUseCurrentDateTime}
    />,
  )
  return { ...view, onPreviewDateTimeChange, onUseCurrentDateTime }
}

describe("preview control dock", () => {
  it("starts at the edge and opens from its visible handle", () => {
    renderDock()
    const dock = screen.getByRole("complementary", { name: "サイトプレビュー操作" })

    expect(dock.getAttribute("data-state")).toBe("closed")
    const handle = screen.getByRole("button", { name: "プレビュー操作を開く" })
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 380 })
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 380 })
    fireEvent.click(handle)
    expect(dock.getAttribute("data-state")).toBe("open")
    expect(screen.getByRole("navigation", { name: "管理画面へ移動" })).toBeTruthy()
  })

  it("joins the handle and card into one shadowed surface", () => {
    renderDock()
    const dock = screen.getByRole("complementary", { name: "サイトプレビュー操作" })
    const handle = screen.getByRole("button", { name: "プレビュー操作を開く" })
    const card = dock.querySelector("[id][aria-hidden]")

    expect(dock.className).toContain("drop-shadow-2xl")
    expect(handle.className).toContain("-left-6.75")
    expect(handle.className).not.toContain("shadow-lg")
    expect(handle.className).toContain("bg-white")
    expect(card?.className).toContain("bg-white")
    expect(card?.className).not.toContain("backdrop-blur")
  })

  it("opens when the edge handle is dragged to the left", () => {
    renderDock()
    const dock = screen.getByRole("complementary", { name: "サイトプレビュー操作" })
    Object.defineProperty(dock, "offsetWidth", { configurable: true, value: 320 })
    const handle = screen.getByRole("button", { name: "プレビュー操作を開く" })

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 380 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 180 })
    expect(dock.style.transform).toContain("translateX(")
    expect(dock.style.transform).not.toContain("-50%")
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 180 })

    expect(dock.getAttribute("data-state")).toBe("open")
    expect(dock.querySelector(".lucide-chevron-right")).toBeTruthy()
    expect(screen.getAllByRole("button", { name: "プレビュー操作を収納" })).toHaveLength(1)
  })

  it("keeps its state when dragging is cancelled", () => {
    renderDock()
    const dock = screen.getByRole("complementary", { name: "サイトプレビュー操作" })
    Object.defineProperty(dock, "offsetWidth", { configurable: true, value: 320 })
    const handle = screen.getByRole("button", { name: "プレビュー操作を開く" })

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 380 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 260 })
    fireEvent.pointerCancel(handle, { pointerId: 1, clientX: 260 })

    expect(dock.getAttribute("data-state")).toBe("closed")
    expect(dock.style.transform).toBe("")
  })

  it("updates the preview time and exposes management destinations", () => {
    const { onPreviewDateTimeChange, onUseCurrentDateTime } = renderDock()
    fireEvent.click(screen.getByRole("button", { name: "プレビュー操作を開く" }))

    fireEvent.click(screen.getByRole("button", { name: "プレビュー日時を変更" }))
    fireEvent.click(screen.getByRole("button", { name: "2026年10月15日を選択" }))
    fireEvent.click(screen.getByRole("button", { name: "現在日時を使用" }))

    expect(onPreviewDateTimeChange).toHaveBeenCalledWith("2026-10-15T12:00")
    expect(onUseCurrentDateTime).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("link", { name: "名簿" }).getAttribute("href")).toBe("/roster")
    expect(screen.getByRole("link", { name: "投票結果" }).getAttribute("href")).toBe("/vote")
  })
})
