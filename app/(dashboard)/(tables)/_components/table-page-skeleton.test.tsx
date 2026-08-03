import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Users } from "lucide-react"
import { LOADING_ROWS } from "../../_components/loading-primitives"
import { TablePageSkeleton } from "./table-page-skeleton"

afterEach(cleanup)

describe("table page skeleton", () => {
  it("renders a skeleton in every visible data cell", () => {
    render(
      <TablePageSkeleton
        icon={Users}
        title="名簿"
        addLabel="メンバーを追加"
        columns={[
          { label: "氏名", className: "min-w-56" },
          { label: "所属局", className: "min-w-44" },
        ]}
      />,
    )

    const table = screen.getByRole("table", { name: "名簿のデータを読み込み中" })
    expect(screen.getByText("メンバーを追加")).toBeTruthy()
    const headerRow = within(table).getAllByRole("row")[0]
    expect(headerRow.classList.contains("bg-muted/80")).toBe(true)
    expect(headerRow.classList.contains("[&>th]:border-b-2")).toBe(true)
    const rows = within(table).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(LOADING_ROWS.length)
    rows.forEach((row) => {
      expect(within(row).getAllByRole("cell")).toHaveLength(2)
      expect(row.querySelectorAll(".animate-pulse")).toHaveLength(2)
    })
  })
})
