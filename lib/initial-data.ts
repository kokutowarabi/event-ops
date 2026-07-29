import type { Shift, ShiftData } from "@/components/shift-manager"
import {
  eventSchedule,
  getFestivalDay,
  operationPeriod,
} from "@/lib/event-schedule"
import { initialOrganizations, initialProjects, type EventOrganization, type EventProject } from "@/lib/event-data"
import { initialMembers, type Member } from "@/lib/members"

export type SharedAppState = {
  members: Member[]
  organizations: EventOrganization[]
  projects: EventProject[]
  shiftData: ShiftData
}

const workTemplateIds = [
  "reception",
  "guide",
  "stage",
  "security",
  "exhibitor",
  "setup",
] as const

const templateKinds = {
  reception: "morning",
  guide: "day",
  stage: "full",
  security: "evening",
  exhibitor: "day",
  setup: "evening",
  break: "day",
} as const satisfies Record<string, Shift["kind"]>

function addDays(key: string, amount: number) {
  const [year, month, day] = key.split("-").map(Number)
  const date = new Date(year, month - 1, day + amount)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0")
  const nextDay = String(date.getDate()).padStart(2, "0")
  return `${nextYear}-${nextMonth}-${nextDay}`
}

function dateDiff(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split("-").map(Number)
  const [endYear, endMonth, endDay] = end.split("-").map(Number)
  const startTime = Date.UTC(startYear, startMonth - 1, startDay)
  const endTime = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.max(0, Math.round((endTime - startTime) / 86_400_000))
}

function parseTime(time: string) {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

const operationDates = Array.from(
  { length: dateDiff(operationPeriod.startDate, operationPeriod.endDate) + 1 },
  (_, index) => addDays(operationPeriod.startDate, index),
)

function createInitialShifts() {
  return operationDates.flatMap((date, dateIndex) => {
    const festivalDay = getFestivalDay(date)
    const isPreparation = date <= eventSchedule.preparationPeriod.endDate
    const workStart = festivalDay ? 8 * 60 : 9 * 60
    const workEnd = festivalDay
      ? parseTime(festivalDay.endTime) + 60
      : isPreparation
        ? 17 * 60
        : 16 * 60

    return initialMembers.flatMap((member, memberIndex) => {
      const breakStart = 11 * 60 + 30 + (memberIndex % 4) * 30
      const breakEnd = breakStart + 45
      const firstTemplateId = workTemplateIds[(memberIndex + dateIndex) % workTemplateIds.length]
      const secondTemplateId = workTemplateIds[(memberIndex + dateIndex + 2) % workTemplateIds.length]
      const baseId = `${date}-${member.id}`

      return [
        {
          id: `${baseId}-1`,
          memberId: member.id,
          date,
          start: workStart,
          end: breakStart,
          templateId: firstTemplateId,
          kind: templateKinds[firstTemplateId],
          note: `${festivalDay ? "本祭" : isPreparation ? "準備" : "片付け"}・午前担当`,
        },
        {
          id: `${baseId}-break`,
          memberId: member.id,
          date,
          start: breakStart,
          end: breakEnd,
          templateId: "break",
          kind: templateKinds.break,
          note: "休憩",
        },
        {
          id: `${baseId}-2`,
          memberId: member.id,
          date,
          start: breakEnd,
          end: workEnd,
          templateId: secondTemplateId,
          kind: templateKinds[secondTemplateId],
          note: `${festivalDay ? "本祭" : isPreparation ? "準備" : "片付け"}・午後担当`,
        },
      ] satisfies Shift[]
    })
  })
}

const initialShiftData: ShiftData = {
  sheets: [
    {
      id: "festival-operations",
      name: "星浜祭 運営期間",
      memberIds: initialMembers.map((member) => member.id),
      startDate: operationPeriod.startDate,
      endDate: operationPeriod.endDate,
    },
  ],
  shifts: createInitialShifts(),
  customShiftTemplates: {},
}

export function createInitialSharedState(): SharedAppState {
  return {
    members: structuredClone(initialMembers),
    organizations: structuredClone(initialOrganizations),
    projects: structuredClone(initialProjects),
    shiftData: structuredClone(initialShiftData),
  }
}

export function isSharedAppState(value: unknown): value is SharedAppState {
  if (!value || typeof value !== "object") return false
  const state = value as Partial<SharedAppState>
  return (
    Array.isArray(state.members) &&
    Array.isArray(state.organizations) &&
    Array.isArray(state.projects) &&
    Boolean(state.shiftData) &&
    Array.isArray(state.shiftData?.sheets) &&
    Array.isArray(state.shiftData?.shifts) &&
    Boolean(state.shiftData?.customShiftTemplates)
  )
}
