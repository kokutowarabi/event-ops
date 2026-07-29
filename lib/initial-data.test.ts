import { describe, expect, it } from "vitest"
import { createInitialAppState } from "@/lib/initial-data"

describe("initial app data", () => {
  const state = createInitialAppState()

  it("contains 20 organizations and two projects per organization", () => {
    expect(state.organizations).toHaveLength(20)
    expect(state.projects).toHaveLength(40)

    for (const organization of state.organizations) {
      expect(
        state.projects.filter((project) => project.organizationName === organization.name),
      ).toHaveLength(2)
    }
  })

  it("assigns every member on every operation date with a break", () => {
    const sheet = state.shiftData.sheets[0]
    expect(sheet.memberIds).toHaveLength(20)
    expect(state.shiftData.shifts).toHaveLength(600)

    const memberDateGroups = new Map<string, typeof state.shiftData.shifts>()
    for (const shift of state.shiftData.shifts) {
      const key = `${shift.memberId}:${shift.date}`
      memberDateGroups.set(key, [...(memberDateGroups.get(key) ?? []), shift])
    }

    expect(memberDateGroups.size).toBe(200)
    for (const shifts of memberDateGroups.values()) {
      expect(shifts).toHaveLength(3)
      expect(shifts.filter((shift) => shift.templateId === "break")).toHaveLength(1)
    }
  })
})
