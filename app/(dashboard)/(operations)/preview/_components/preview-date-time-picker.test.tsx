import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { PreviewDateTimePicker } from "./preview-date-time-picker"

afterEach(cleanup)

function PickerHarness() {
  const [value, setValue] = useState("2026-10-31T12:00")
  return (
    <>
      <PreviewDateTimePicker value={value} onChange={setValue} />
      <output aria-label="選択中の日時">{value}</output>
    </>
  )
}

describe("preview date time picker", () => {
  it("selects a date from the custom calendar", () => {
    render(<PickerHarness />)

    fireEvent.click(screen.getByRole("button", { name: "プレビュー日時を変更" }))
    fireEvent.click(screen.getByRole("button", { name: "2026年10月15日を選択" }))

    expect(screen.getByLabelText("選択中の日時").textContent)
      .toBe("2026-10-15T12:00")
  })

  it("selects hours and minutes without a native datetime input", () => {
    render(<PickerHarness />)
    fireEvent.click(screen.getByRole("button", { name: "プレビュー日時を変更" }))

    const hourWheel = screen.getByRole("listbox", { name: "時" })
    const hour = within(hourWheel).getByRole("option", { name: "13" })
    fireEvent.pointerDown(hour, { pointerType: "mouse" })
    fireEvent.click(hour)

    const minuteWheel = screen.getByRole("listbox", { name: "分" })
    const minute = within(minuteWheel).getByRole("option", { name: "45" })
    fireEvent.pointerDown(minute, { pointerType: "mouse" })
    fireEvent.click(minute)

    expect(screen.getByLabelText("選択中の日時").textContent)
      .toBe("2026-10-31T13:45")
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull()
  })
})
