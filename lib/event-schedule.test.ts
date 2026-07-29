import { describe, expect, it } from "vitest"
import {
  getOperationDayLabel,
  getSiteTimingStatus,
  initialSiteCmsContent,
  operationPeriod,
} from "@/lib/event-schedule"

describe("event schedule", () => {
  it("uses preparation through cleanup as the shift operation period", () => {
    expect(operationPeriod).toEqual({
      startDate: "2026-10-26",
      endDate: "2026-11-04",
    })
    expect(getOperationDayLabel("2026-10-26")).toBe("準備")
    expect(getOperationDayLabel("2026-10-31")).toBe("本祭 1日目・10:00〜18:00")
    expect(getOperationDayLabel("2026-11-04")).toBe("片付け")
  })

  it("shows a calendar-day countdown before the festival", () => {
    const status = getSiteTimingStatus(new Date(2026, 9, 20, 12, 0), initialSiteCmsContent)

    expect(status.phase).toBe("before-festival")
    expect(status.title).toBe("本祭まであと11日")
  })

  it("distinguishes before opening, live, and after closing on festival days", () => {
    const beforeOpen = getSiteTimingStatus(new Date(2026, 9, 31, 9, 0), initialSiteCmsContent)
    const live = getSiteTimingStatus(new Date(2026, 9, 31, 12, 0), initialSiteCmsContent)
    const afterClose = getSiteTimingStatus(new Date(2026, 9, 31, 19, 0), initialSiteCmsContent)

    expect(beforeOpen).toMatchObject({
      phase: "before-open",
      title: "本日開催",
      countdownLabel: "開場まで",
      countdown: "1時間 0分",
    })
    expect(live).toMatchObject({
      phase: "live",
      title: "開催中",
      countdownLabel: "本日の終了まで",
      countdown: "6時間 0分",
    })
    expect(afterClose).toMatchObject({
      phase: "after-close",
      title: "本日の開催は終了しました",
      countdownLabel: "次の開催まで",
    })
  })

  it("shows a thank-you message after the final closing time", () => {
    const status = getSiteTimingStatus(new Date(2026, 10, 2, 17, 0), initialSiteCmsContent)

    expect(status).toMatchObject({
      phase: "after-festival",
      title: "ご来場ありがとうございました",
      countdown: null,
    })
  })
})
