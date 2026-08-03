import { cleanup, fireEvent, render, screen } from "@testing-library/react"
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

  it("keeps a select open until an option is committed", () => {
    const onCommit = vi.fn()
    render(
      <EditableSelectCell
        value="執行部"
        options={["執行部", "運営局・第1部門"]}
        onCommit={onCommit}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "執行部" }))
    const option = screen.getByRole("option", { name: "運営局・第1部門" })
    fireEvent.pointerDown(option, { pointerType: "mouse" })
    fireEvent.click(option)

    expect(onCommit).toHaveBeenCalledWith("運営局・第1部門")
  })

  it("edits multiple values in a card outside the table cell", () => {
    const onCommit = vi.fn()
    render(
      <table>
        <tbody>
          <tr>
            <td>
              <EditableMultiSelectCell
                values={["局長"]}
                options={["局長", "役員"]}
                onCommit={onCommit}
              />
            </td>
          </tr>
        </tbody>
      </table>,
    )

    const cell = screen.getByRole("cell")
    fireEvent.click(screen.getByRole("button", { name: "局長" }))
    const card = screen.getByRole("dialog", { name: "役職を選択" })
    expect(cell.contains(card)).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: "役員" }))
    fireEvent.click(screen.getByRole("button", { name: "役職を保存" }))
    expect(onCommit).toHaveBeenCalledWith(["局長", "役員"])
  })
})
