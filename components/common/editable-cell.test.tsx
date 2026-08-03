import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  EditableMultiSelectCell,
  EditableSelectCell,
  EditableTextCell,
} from "./editable-cell"

afterEach(cleanup)

describe("editable cells", () => {
  it("truncates long values while the cell is not being edited", () => {
    render(
      <>
        <EditableTextCell value="長い企画名" onCommit={vi.fn()} />
        <EditableSelectCell value="教室" options={["教室"]} onCommit={vi.fn()} />
        <EditableMultiSelectCell values={["局長"]} options={["局長"]} onCommit={vi.fn()} />
      </>,
    )

    screen.getAllByRole("button").forEach((button) => {
      expect(button.classList.contains("truncate")).toBe(true)
      expect(button.classList.contains("max-w-full")).toBe(true)
    })
  })
})
