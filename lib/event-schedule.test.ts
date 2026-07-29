import { describe, expect, it } from "vitest"
import {
  getOperationDayLabel,
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
})
