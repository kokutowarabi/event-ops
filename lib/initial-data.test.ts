import { describe, expect, it } from "vitest"
import {
  createInitialAppState,
  createInitialDashboardState,
  createInitialShiftData,
} from "@/lib/initial-data"

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
    const schedule = state.shiftData.schedule
    expect(schedule?.memberIds).toHaveLength(57)
    expect(state.shiftData.shifts).toHaveLength(1710)

    const memberDateGroups = new Map<string, typeof state.shiftData.shifts>()
    for (const shift of state.shiftData.shifts) {
      const key = `${shift.memberId}:${shift.date}`
      memberDateGroups.set(key, [...(memberDateGroups.get(key) ?? []), shift])
    }

    expect(memberDateGroups.size).toBe(570)
    for (const shifts of memberDateGroups.values()) {
      expect(shifts).toHaveLength(3)
      expect(shifts.filter((shift) => shift.templateId === "break")).toHaveLength(1)
    }
  })

  it("adds two members per department without duplicating exclusive leaders", () => {
    const departmentCounts = new Map<string, number>()
    for (const member of state.members) {
      departmentCounts.set(
        member.department,
        (departmentCounts.get(member.department) ?? 0) + 1,
      )
    }

    expect(departmentCounts.size).toBe(19)
    expect(departmentCounts.get("執行部")).toBe(3)
    for (const [department, count] of departmentCounts) {
      if (department !== "執行部") expect(count).toBe(3)
    }

    expect(state.members.filter((member) => member.role === "委員長")).toHaveLength(1)
    expect(state.members.filter((member) => member.role === "副委員長")).toHaveLength(2)
    expect(state.members.filter((member) => member.role.includes("局長"))).toHaveLength(15)
    expect(state.members.filter((member) => member.role.startsWith("局長"))).toHaveLength(6)
    expect(state.members.some((member) => member.name === "石井 航")).toBe(false)
  })

  it("can create dashboard and shift payloads independently", () => {
    const dashboardState = createInitialDashboardState()
    const shiftData = createInitialShiftData()

    expect(dashboardState).not.toHaveProperty("shiftData")
    expect(dashboardState.members).toHaveLength(57)
    expect(shiftData.shifts).toHaveLength(1710)
  })
})
