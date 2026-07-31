import type { CSSProperties } from "react"
import type {
  Shift,
  ShiftKind,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"

export type { Shift } from "@/lib/shift-data"

export type ShiftAdjustmentChange = {
  before: Shift
  after: Shift | null
}

export type ShiftTemplateColor = {
  blockStyle: CSSProperties
  dotStyle: CSSProperties
}

export const START_MINUTES = 6 * 60
export const END_MINUTES = 22 * 60
export const SLOT_MINUTES = 15
export const COVERAGE_SLOT_MINUTES = 30

export const shiftKinds: Record<ShiftKind, { label: string }> = {
  morning: { label: "オレンジ" },
  day: { label: "ブルー" },
  evening: { label: "グリーン" },
  full: { label: "パープル" },
}

export const DEFAULT_SHIFT_TEMPLATE_ID = "tentative"

export const shiftTemplates: Record<ShiftTemplateId, ShiftTemplate> = {
  [DEFAULT_SHIFT_TEMPLATE_ID]: { label: "未指定", kind: "day", defaultMinutes: 60, note: "未指定" },
  reception: { label: "受付", kind: "morning", defaultMinutes: 180, note: "受付・来場者対応" },
  guide: { label: "会場誘導", kind: "day", defaultMinutes: 240, note: "導線案内・列整理" },
  stage: { label: "ステージ進行", kind: "full", defaultMinutes: 180, note: "登壇者誘導・転換補助" },
  security: { label: "警備・巡回", kind: "evening", defaultMinutes: 180, note: "会場巡回・混雑対応" },
  exhibitor: { label: "出展者対応", kind: "day", defaultMinutes: 180, note: "参加団体受付・控室対応" },
  setup: { label: "設営・撤収", kind: "evening", defaultMinutes: 120, note: "備品搬入・撤収確認" },
  break: { label: "休憩", kind: "day", defaultMinutes: 45, note: "休憩" },
}

export function createShiftTemplateColor(index: number): ShiftTemplateColor {
  const hue = Math.round((210 + index * 137.508) % 360)
  return {
    blockStyle: {
      borderColor: `hsl(${hue} 72% 42% / 0.45)`,
      backgroundColor: `hsl(${hue} 86% 90% / 0.94)`,
      color: `hsl(${hue} 68% 22%)`,
    },
    dotStyle: {
      backgroundColor: `hsl(${hue} 72% 48%)`,
    },
  }
}

export function addDays(key: string, amount: number) {
  const [year, month, day] = key.split("-").map(Number)
  const date = new Date(year, month - 1, day + amount)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0")
  const nextDay = String(date.getDate()).padStart(2, "0")
  return `${nextYear}-${nextMonth}-${nextDay}`
}

export function dateDiff(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split("-").map(Number)
  const [endYear, endMonth, endDay] = end.split("-").map(Number)
  const startTime = new Date(startYear, startMonth - 1, startDay).getTime()
  const endTime = new Date(endYear, endMonth - 1, endDay).getTime()
  return Math.max(0, Math.round((endTime - startTime) / 86_400_000))
}

export function formatDate(key: string) {
  const [year, month, day] = key.split("-")
  return `${year}/${month}/${day}`
}

export function formatTime(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
}

export function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

export function clampShiftEnd(end: number, start: number) {
  return Math.min(Math.max(end, start + SLOT_MINUTES), END_MINUTES)
}

export const timeOptions = Array.from(
  { length: (END_MINUTES - START_MINUTES) / SLOT_MINUTES + 1 },
  (_, index) => {
    const minutes = START_MINUTES + index * SLOT_MINUTES
    const label = formatTime(minutes)
    return { value: label, label, minutes }
  },
)

export const timeSlots = timeOptions.slice(0, -1)

export const coverageTimeSlots = Array.from(
  { length: (END_MINUTES - START_MINUTES) / COVERAGE_SLOT_MINUTES },
  (_, index) => START_MINUTES + index * COVERAGE_SLOT_MINUTES,
)

export function shouldSplitShiftTimeLabels(start: number, end: number) {
  return end - start < 75
}

export function getCreateShiftTimeRange(startSlot: number, currentSlot: number) {
  const firstSlot = Math.min(startSlot, currentSlot)
  const lastSlotExclusive = Math.max(startSlot, currentSlot) + 1
  return {
    start: START_MINUTES + firstSlot * SLOT_MINUTES,
    end: START_MINUTES + lastSlotExclusive * SLOT_MINUTES,
  }
}

export function shiftsEqual(left: Shift[], right: Shift[]) {
  if (left.length !== right.length) return false
  return left.every((shift, index) => {
    const next = right[index]
    return (
      shift.id === next.id
      && shift.memberId === next.memberId
      && shift.date === next.date
      && shift.start === next.start
      && shift.end === next.end
      && shift.templateId === next.templateId
      && shift.kind === next.kind
      && shift.note === next.note
    )
  })
}

export function isSlotOccupied(
  shifts: Shift[],
  memberId: string,
  date: string,
  slot: number,
  ignoreShiftId?: string,
) {
  const slotStart = START_MINUTES + slot * SLOT_MINUTES
  const slotEnd = slotStart + SLOT_MINUTES
  return shifts.some(
    (shift) =>
      shift.id !== ignoreShiftId
      && shift.memberId === memberId
      && shift.date === date
      && shift.start < slotEnd
      && shift.end > slotStart,
  )
}

export function canPlaceShift(
  shifts: Shift[],
  memberId: string,
  date: string,
  start: number,
  end: number,
  ignoreShiftId: string,
) {
  if (start < START_MINUTES || end > END_MINUTES || end <= start) return false
  return !shifts.some(
    (shift) =>
      shift.id !== ignoreShiftId
      && shift.memberId === memberId
      && shift.date === date
      && shift.start < end
      && shift.end > start,
  )
}

export function adjustConflictingShiftRanges(
  shifts: Shift[],
  memberId: string,
  date: string,
  start: number,
  end: number,
  ignoreShiftId?: string,
) {
  if (start < START_MINUTES || end > END_MINUTES || end <= start) return null

  const adjustedShiftIds: string[] = []
  const removedShiftIds: string[] = []
  const adjustedShifts = shifts.flatMap((shift) => {
    const conflicts =
      shift.id !== ignoreShiftId
      && shift.memberId === memberId
      && shift.date === date
      && shift.start < end
      && shift.end > start
    if (!conflicts) return [shift]

    const leftDuration = start - shift.start
    const rightDuration = shift.end - end
    const canKeepLeft = leftDuration >= SLOT_MINUTES
    const canKeepRight = rightDuration >= SLOT_MINUTES
    adjustedShiftIds.push(shift.id)
    if (!canKeepLeft && !canKeepRight) {
      removedShiftIds.push(shift.id)
      return []
    }

    return [
      canKeepLeft && (!canKeepRight || leftDuration >= rightDuration)
        ? { ...shift, end: start }
        : { ...shift, start: end },
    ]
  })

  return { shifts: adjustedShifts, adjustedShiftIds, removedShiftIds }
}

export function getShiftAdjustmentChanges(
  beforeShifts: Shift[],
  afterShifts: Shift[],
  ignoreShiftId?: string,
): ShiftAdjustmentChange[] {
  const afterById = new Map(afterShifts.map((shift) => [shift.id, shift]))
  return beforeShifts.flatMap((before) => {
    if (before.id === ignoreShiftId) return []
    const after = afterById.get(before.id) ?? null
    if (after && after.start === before.start && after.end === before.end) return []
    return [{ before, after }]
  })
}

export function copyShiftForMember(shift: Shift, memberId: string, id: string): Shift {
  return { ...shift, id, memberId }
}

export function canCopyShiftToMember(shifts: Shift[], sourceShift: Shift, memberId: string) {
  return memberId !== sourceShift.memberId
    && canPlaceShift(
      shifts,
      memberId,
      sourceShift.date,
      sourceShift.start,
      sourceShift.end,
      sourceShift.id,
    )
}

export function orderMemberIdsWithPins(
  scheduledMemberIds: string[],
  filteredMemberIds: string[],
  pinnedMemberIds: string[],
): string[] {
  const scheduled = new Set(scheduledMemberIds)
  const ordered: string[] = []
  const seen = new Set<string>()
  const append = (memberId: string) => {
    if (!scheduled.has(memberId) || seen.has(memberId)) return
    seen.add(memberId)
    ordered.push(memberId)
  }

  pinnedMemberIds.forEach(append)
  filteredMemberIds.forEach(append)
  return ordered
}
