import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MobileCardSection } from "./mobile-card-section"

afterEach(cleanup)

describe("mobile card section", () => {
  it("shows one position dot per card and follows horizontal scrolling", () => {
    render(
      <MobileCardSection title="執行部" titleId="executive-section">
        <article>田中 太郎</article>
        <article>佐藤 花子</article>
        <article>高橋 美咲</article>
      </MobileCardSection>,
    )

    const position = screen.getByLabelText("執行部のカード位置")
    const dots = Array.from(position.querySelectorAll("button"))
    expect(dots).toHaveLength(3)
    expect(dots[0].getAttribute("aria-current")).toBe("true")

    const scroller = screen.getByText("田中 太郎").parentElement!
    const cards = Array.from(scroller.children) as HTMLElement[]
    let scrollOffset = 0
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({ left: 0 } as DOMRect)
    cards.forEach((card, index) => {
      vi.spyOn(card, "getBoundingClientRect").mockImplementation(
        () => ({ left: index * 300 - scrollOffset }) as DOMRect,
      )
    })

    scrollOffset = 300
    fireEvent.scroll(scroller)
    expect(dots[1].getAttribute("aria-current")).toBe("true")
    expect(screen.getByText("3人")).toBeTruthy()
  })
})
