import { describe, expect, it } from "vitest"
import { getSitePreviewStatus } from "@/lib/site-preview"

describe("site preview status", () => {
  it("shows a countdown before the festival", () => {
    expect(getSitePreviewStatus("2026-10-29T12:00")).toMatchObject({
      phase: "before",
      headline: "本祭まであと2日",
      votingOpen: false,
    })
  })

  it("opens voting during festival hours", () => {
    expect(getSitePreviewStatus("2026-11-01T12:00")).toMatchObject({
      phase: "open",
      voteDate: "2026-11-01",
      votingOpen: true,
    })
  })

  it("closes voting outside festival hours", () => {
    expect(getSitePreviewStatus("2026-10-31T19:00")).toMatchObject({
      phase: "closed-today",
      votingOpen: false,
    })
  })

  it("thanks visitors after the final day", () => {
    expect(getSitePreviewStatus("2026-11-03T09:00")).toMatchObject({
      phase: "after",
      votingOpen: false,
    })
  })
})
