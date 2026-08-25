import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { TimeWheelPicker } from "./time-wheel-picker"

afterEach(cleanup)

function Harness() {
  const [value, setValue] = useState("09:00")
  return <TimeWheelPicker value={value} onChange={setValue} label="開始時刻" minuteStep={15} />
}

describe("time wheel picker", () => {
  it("opens an accessible wheel with hour and minute columns", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "開始時刻を変更" }))

    expect(screen.getByRole("dialog", { name: "開始時刻を選択" })).toBeTruthy()
    expect(screen.getByRole("listbox", { name: "時" })).toBeTruthy()
    expect(screen.getByRole("listbox", { name: "分" })).toBeTruthy()
    expect(screen.getAllByRole("option").length).toBeGreaterThan(4)
  })

  it("changes the value from the wheel option", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "開始時刻を変更" }))
    fireEvent.click(screen.getByRole("option", { name: "10" }))

    expect(screen.getByRole("button", { name: "開始時刻を変更" }).textContent).toContain("10:00")
  })
})
