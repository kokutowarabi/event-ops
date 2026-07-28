import type { ShiftData } from "@/components/shift-manager"
import { initialOrganizations, initialProjects, type EventOrganization, type EventProject } from "@/lib/event-data"
import { initialMembers, type Member } from "@/lib/members"

export type DemoState = {
  members: Member[]
  organizations: EventOrganization[]
  projects: EventProject[]
  shiftData: ShiftData
  votedProjectIds: string[]
}

export const demoStorageKey = "hoshihama-eventops-demo-v1"

const initialShiftData: ShiftData = {
  sheets: [
    {
      id: "festival-day-1",
      name: "星浜祭 1日目",
      memberIds: ["1", "2", "3", "4", "5", "6"],
      startDate: "2026-10-31",
      endDate: "2026-11-02",
    },
  ],
  shifts: [
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

export function readDemoState(): DemoState {
  const saved = window.localStorage.getItem(demoStorageKey)
  if (!saved) return createInitialDemoState()

  try {
    const parsed: unknown = JSON.parse(saved)
    return isDemoState(parsed) ? parsed : createInitialDemoState()
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
