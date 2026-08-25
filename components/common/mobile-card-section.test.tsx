import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MobileCardSection } from "./mobile-card-section"

afterEach(cleanup)

describe("mobile card section", () => {
  it("renders cards in a free-scrolling row", () => {
    render(
      <MobileCardSection title="執行部" titleId="executive-section">
        <article>田中 太郎</article>
        <article>佐藤 花子</article>
        <article>高橋 美咲</article>
      </MobileCardSection>,
    )

    const scroller = screen.getByText("田中 太郎").parentElement!
    expect(screen.queryByLabelText("執行部のカード位置")).toBeNull()
    expect(scroller.className).not.toContain("snap-")
    expect(screen.getByText("3人")).toBeTruthy()
  })
})
