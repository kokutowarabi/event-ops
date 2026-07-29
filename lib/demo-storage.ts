import type { ShiftData } from "@/components/shift-manager"
import {
  initialSiteCmsContent,
  operationPeriod,
  type SiteCmsContent,
} from "@/lib/event-schedule"
import { initialOrganizations, initialProjects, type EventOrganization, type EventProject } from "@/lib/event-data"
import { initialMembers, type Member } from "@/lib/members"

export type DemoState = {
  members: Member[]
  organizations: EventOrganization[]
  projects: EventProject[]
  shiftData: ShiftData
  votedProjectIds: string[]
  siteCmsContent: SiteCmsContent
}

export const demoStorageKey = "hoshihama-eventops-demo-v1"

const initialShiftData: ShiftData = {
  sheets: [
    {
      id: "festival-operations",
      name: "星浜祭 運営期間",
      memberIds: ["1", "2", "3", "4", "5", "6"],
      startDate: operationPeriod.startDate,
      endDate: operationPeriod.endDate,
    },
  ],
  shifts: [
    {
      id: "s0",
      memberId: "6",
      date: "2026-10-26",
      start: 10 * 60,
      end: 16 * 60,
      templateId: "setup",
      kind: "day",
      note: "備品確認・設営準備",
    },
    {
      id: "s1",
      memberId: "1",
      date: "2026-10-31",
      start: 9 * 60,
      end: 17 * 60,
      templateId: "guide",
      kind: "day",
      note: "本部連絡・導線確認",
    },
    {
      id: "s2",
      memberId: "2",
      date: "2026-10-31",
      start: 7 * 60,
      end: 12 * 60,
      templateId: "reception",
      kind: "morning",
      note: "受付設営・来場者対応",
    },
    {
      id: "s3",
      memberId: "3",
      date: "2026-10-31",
      start: 15 * 60,
      end: 21 * 60,
      templateId: "security",
      kind: "evening",
      note: "混雑対応・巡回",
    },
    {
      id: "s4",
      memberId: "5",
      date: "2026-10-31",
      start: 10 * 60,
      end: 18 * 60,
      templateId: "stage",
      kind: "full",
      note: "音響確認・転換補助",
    },
    {
      id: "s5",
      memberId: "4",
      date: "2026-11-01",
      start: 8 * 60,
      end: 14 * 60,
      templateId: "exhibitor",
      kind: "morning",
      note: "参加団体受付・教室巡回",
    },
    {
      id: "s6",
      memberId: "1",
      date: "2026-11-04",
      start: 9 * 60,
      end: 13 * 60,
      templateId: "setup",
      kind: "morning",
      note: "備品返却・最終確認",
    },
  ],
  customShiftTemplates: {},
}

export function createInitialDemoState(): DemoState {
  return {
    members: structuredClone(initialMembers),
    organizations: structuredClone(initialOrganizations),
    projects: structuredClone(initialProjects),
    shiftData: structuredClone(initialShiftData),
    votedProjectIds: [],
    siteCmsContent: structuredClone(initialSiteCmsContent),
  }
}

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false
  const state = value as Partial<DemoState>
  return (
    Array.isArray(state.members) &&
    Array.isArray(state.organizations) &&
    Array.isArray(state.projects) &&
    Array.isArray(state.votedProjectIds) &&
    Boolean(state.shiftData) &&
    Array.isArray(state.shiftData?.sheets) &&
    Array.isArray(state.shiftData?.shifts)
  )
}

function normalizeDemoState(state: DemoState): DemoState {
  const siteCmsContent = {
    ...initialSiteCmsContent,
    ...(state.siteCmsContent ?? {}),
  }
  const shiftData = {
    ...state.shiftData,
    sheets: state.shiftData.sheets.map((sheet) =>
      sheet.id === "festival-day-1" &&
      sheet.startDate === "2026-10-31" &&
      sheet.endDate === "2026-11-02"
        ? {
          ...sheet,
          id: "festival-operations",
          name: "星浜祭 運営期間",
          startDate: operationPeriod.startDate,
          endDate: operationPeriod.endDate,
        }
        : sheet,
    ),
  }
  return { ...state, shiftData, siteCmsContent }
}

export function readDemoState(): DemoState {
  const saved = window.localStorage.getItem(demoStorageKey)
  if (!saved) return createInitialDemoState()

  try {
    const parsed: unknown = JSON.parse(saved)
    return isDemoState(parsed) ? normalizeDemoState(parsed) : createInitialDemoState()
  } catch {
    return createInitialDemoState()
  }
}

export function writeDemoState(state: DemoState) {
  window.localStorage.setItem(demoStorageKey, JSON.stringify(state))
}

export function clearDemoState() {
  window.localStorage.removeItem(demoStorageKey)
}
