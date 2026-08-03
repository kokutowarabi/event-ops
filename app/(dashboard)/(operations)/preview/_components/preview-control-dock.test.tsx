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
      projectCount={40}
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

    expect(dock.className).toContain("drop-shadow-2xl")
    expect(handle.className).toContain("right-full")
    expect(handle.className).not.toContain("shadow-lg")
  })

  it("opens when the edge handle is dragged to the left", () => {
    renderDock()
    const dock = screen.getByRole("complementary", { name: "サイトプレビュー操作" })
    Object.defineProperty(dock, "offsetWidth", { configurable: true, value: 320 })
    const handle = screen.getByRole("button", { name: "プレビュー操作を開く" })

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 380 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 180 })
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 180 })

    expect(dock.getAttribute("data-state")).toBe("open")
  })

  it("updates the preview time and exposes management destinations", () => {
    const { onPreviewDateTimeChange, onUseCurrentDateTime } = renderDock()
    fireEvent.click(screen.getByRole("button", { name: "プレビュー操作を開く" }))

    fireEvent.input(screen.getByLabelText("プレビュー日時"), {
      target: { value: "2026-11-01T10:00" },
    })
    fireEvent.click(screen.getByRole("button", { name: "現在日時を使用" }))

    expect(onPreviewDateTimeChange).toHaveBeenCalledWith("2026-11-01T10:00")
    expect(onUseCurrentDateTime).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("link", { name: "名簿" }).getAttribute("href")).toBe("/roster")
    expect(screen.getByRole("link", { name: "投票結果" }).getAttribute("href")).toBe("/vote")
  })
})
