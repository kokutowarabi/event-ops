"use client"

import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { CalendarDays, Eye, Plus, Trash2 } from "lucide-react"
import type { Member } from "../lib/members"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AccountRole = "admin" | "viewer"
type ShiftKind = "morning" | "day" | "evening" | "full"
type ShiftTemplateId = string

type ShiftTemplate = {
  label: string
  kind: ShiftKind
  defaultMinutes: number
  note: string
}

type ShiftPage = {
  memberIds: string[]
  startDate: string
  endDate: string
}

type Shift = {
  id: string
  memberId: string
  date: string
  start: number
  end: number
  templateId: ShiftTemplateId
  kind: ShiftKind
  note: string
}

type DraftShift = {
  memberId: string
  date: string
  start: number
  end: number
  templateId: ShiftTemplateId
  note: string
}

type DraftShiftTemplate = {
  label: string
  kind: ShiftKind
  defaultMinutes: number
  note: string
}

type QuickShiftDraft = {
  memberId: string
  templateId: ShiftTemplateId
  start: number
  end: number
  note: string
}

type CreatingShift = {
  memberId: string
  startSlot: number
  currentSlot: number
}

type ResizeEdge = "start" | "end"

type ResizingShift = {
  id: string
  edge: ResizeEdge
  originX: number
  start: number
  end: number
}

type MovingShift = {
  id: string
  originX: number
  pointerOffsetX: number
  pointerX: number
  pointerY: number
  start: number
  end: number
  previewMemberId: string
}

const ALL_DEPARTMENTS = "すべてのセクション"
const START_MINUTES = 6 * 60
const END_MINUTES = 22 * 60
const SLOT_MINUTES = 15
const SLOT_WIDTH = 16
const TIMELINE_PADDING_SLOTS = 2
const TIMELINE_PADDING_WIDTH = TIMELINE_PADDING_SLOTS * SLOT_WIDTH
const TIMELINE_WIDTH = ((END_MINUTES - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
const TIMELINE_TRACK_WIDTH = TIMELINE_WIDTH + TIMELINE_PADDING_WIDTH * 2

const accounts = [
  { id: "admin", name: "管理者", role: "admin" },
  { id: "viewer", name: "メンバー", role: "viewer" },
] satisfies Array<{ id: string; name: string; role: AccountRole }>

const shiftKinds: Record<ShiftKind, { label: string; className: string; dotClassName: string }> = {
  morning: {
    label: "オレンジ",
    className: "border-amber-300/50 bg-amber-400/20 text-amber-950 dark:text-amber-100",
    dotClassName: "bg-amber-400",
  },
  day: {
    label: "ブルー",
    className: "border-sky-300/50 bg-sky-400/20 text-sky-950 dark:text-sky-100",
    dotClassName: "bg-sky-400",
  },
  evening: {
    label: "グリーン",
    className: "border-teal-300/50 bg-teal-400/20 text-teal-950 dark:text-teal-100",
    dotClassName: "bg-teal-400",
  },
  full: {
    label: "パープル",
    className: "border-violet-300/50 bg-violet-400/20 text-violet-950 dark:text-violet-100",
    dotClassName: "bg-violet-400",
  },
}

const DEFAULT_SHIFT_TEMPLATE_ID = "tentative"

const shiftTemplates: Record<ShiftTemplateId, ShiftTemplate> = {
  [DEFAULT_SHIFT_TEMPLATE_ID]: { label: "仮置き", kind: "day", defaultMinutes: 60, note: "仮置き" },
  reception: { label: "受付", kind: "morning", defaultMinutes: 180, note: "受付・来場者対応" },
  guide: { label: "会場誘導", kind: "day", defaultMinutes: 240, note: "導線案内・列整理" },
  stage: { label: "ステージ進行", kind: "full", defaultMinutes: 180, note: "登壇者誘導・転換補助" },
  security: { label: "警備・巡回", kind: "evening", defaultMinutes: 180, note: "会場巡回・混雑対応" },
  exhibitor: { label: "出展者対応", kind: "day", defaultMinutes: 180, note: "団体受付・控室対応" },
  setup: { label: "設営・撤収", kind: "evening", defaultMinutes: 120, note: "備品搬入・撤収確認" },
}

const initialShifts: Shift[] = [
  { id: "s1", memberId: "1", date: "2026-06-26", start: 9 * 60, end: 17 * 60, templateId: "guide", kind: "day", note: "本部連絡・導線確認" },
  { id: "s2", memberId: "2", date: "2026-06-26", start: 7 * 60, end: 12 * 60, templateId: "reception", kind: "morning", note: "受付設営・来場者対応" },
  { id: "s3", memberId: "3", date: "2026-06-26", start: 15 * 60, end: 21 * 60, templateId: "security", kind: "evening", note: "混雑対応・巡回" },
  { id: "s4", memberId: "5", date: "2026-06-27", start: 10 * 60, end: 18 * 60, templateId: "stage", kind: "full", note: "音響確認・転換補助" },
]

function todayKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

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
  const startTime = new Date(startYear, startMonth - 1, startDay).getTime()
  const endTime = new Date(endYear, endMonth - 1, endDay).getTime()
  return Math.max(0, Math.round((endTime - startTime) / 86_400_000))
}

function formatDate(key: string) {
  const [year, month, day] = key.split("-")
  return `${year}/${month}/${day}`
}

function formatTime(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
}

function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

function clampShiftEnd(end: number, start: number) {
  return Math.min(Math.max(end, start + SLOT_MINUTES), END_MINUTES)
}

const timeOptions = Array.from({ length: (END_MINUTES - START_MINUTES) / SLOT_MINUTES + 1 }, (_, index) => {
  const minutes = START_MINUTES + index * SLOT_MINUTES
  const label = formatTime(minutes)
  return { value: label, label, minutes }
})
const timeSlots = timeOptions.slice(0, -1)

function getHoveredSlotRadiusClass(slot: number) {
  if (slot === 0) return "rounded-l-lg"
  if (slot === timeSlots.length - 1) return "rounded-r-lg"
  return ""
}

function shiftsEqual(left: Shift[], right: Shift[]) {
  if (left.length !== right.length) return false
  return left.every((shift, index) => {
    const next = right[index]
    return (
      shift.id === next.id &&
      shift.memberId === next.memberId &&
      shift.date === next.date &&
      shift.start === next.start &&
      shift.end === next.end &&
      shift.templateId === next.templateId &&
      shift.kind === next.kind &&
      shift.note === next.note
    )
  })
}

function isTextEditingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

function isSlotOccupied(shifts: Shift[], memberId: string, date: string, slot: number, ignoreShiftId?: string) {
  const slotStart = START_MINUTES + slot * SLOT_MINUTES
  const slotEnd = slotStart + SLOT_MINUTES
  return shifts.some(
    (shift) =>
      shift.id !== ignoreShiftId &&
      shift.memberId === memberId &&
      shift.date === date &&
      shift.start < slotEnd &&
      shift.end > slotStart,
  )
}

function isRangeFree(shifts: Shift[], memberId: string, date: string, startSlot: number, endSlot: number) {
  const start = Math.min(startSlot, endSlot)
  const end = Math.max(startSlot, endSlot)
  for (let slot = start; slot <= end; slot += 1) {
    if (isSlotOccupied(shifts, memberId, date, slot)) return false
  }
  return true
}

function getAllowedCreateSlot(shifts: Shift[], memberId: string, date: string, startSlot: number, currentSlot: number) {
  if (isRangeFree(shifts, memberId, date, startSlot, currentSlot)) return currentSlot

  const direction = currentSlot >= startSlot ? 1 : -1
  let allowedSlot = startSlot
  for (let slot = startSlot + direction; slot !== currentSlot + direction; slot += direction) {
    if (isSlotOccupied(shifts, memberId, date, slot)) break
    allowedSlot = slot
  }
  return allowedSlot
}

function getMemberIdFromPointer(event: PointerEvent<HTMLElement>) {
  const rows = document.querySelectorAll<HTMLElement>("[data-shift-member-id]")
  for (const row of rows) {
    const rect = row.getBoundingClientRect()
    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      return row.dataset.shiftMemberId ?? null
    }
  }
  return null
}

type ShiftManagerProps = {
  members: Member[]
}

export function ShiftManager({ members }: ShiftManagerProps) {
  const defaultStartDate = todayKey()
  const [accountId, setAccountId] = useState(accounts[0].id)
  const [pageDraft, setPageDraft] = useState<ShiftPage>({
    memberIds: members.slice(0, 6).map((member) => member.id),
    startDate: defaultStartDate,
    endDate: addDays(defaultStartDate, 6),
  })
  const [shiftPages, setShiftPages] = useState<ShiftPage[]>([])
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [shiftPage, setShiftPage] = useState<ShiftPage | null>(null)
  const [selectedDate, setSelectedDate] = useState(defaultStartDate)
  const [departmentFilter, setDepartmentFilter] = useState(ALL_DEPARTMENTS)
  const [memberSearch, setMemberSearch] = useState("")
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)
  const [customShiftTemplates, setCustomShiftTemplates] = useState<Record<ShiftTemplateId, ShiftTemplate>>({})
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [draftShift, setDraftShift] = useState<DraftShift | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateDraft, setTemplateDraft] = useState<DraftShiftTemplate>({
    label: "",
    kind: "day",
    defaultMinutes: 60,
    note: "",
  })
  const [quickShiftDraft, setQuickShiftDraft] = useState<QuickShiftDraft>({
    memberId: members[0]?.id ?? "",
    templateId: DEFAULT_SHIFT_TEMPLATE_ID,
    start: 10 * 60,
    end: 11 * 60,
    note: "",
  })
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [moving, setMoving] = useState<MovingShift | null>(null)
  const [resizing, setResizing] = useState<ResizingShift | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<{ memberId: string; slot: number } | null>(null)
  const [creatingShift, setCreatingShift] = useState<CreatingShift | null>(null)
  const [showSelectedMembersOnly, setShowSelectedMembersOnly] = useState(false)
  const shiftsRef = useRef(shifts)
  const historyRef = useRef<{ past: Shift[][]; future: Shift[][] }>({ past: [], future: [] })
  const moveInitialShiftsRef = useRef<Shift[] | null>(null)
  const resizeInitialShiftsRef = useRef<Shift[] | null>(null)
  const didMoveShiftRef = useRef(false)
  const didResizeShiftRef = useRef(false)

  const account = accounts.find((item) => item.id === accountId) ?? accounts[0]
  const isAdmin = account.role === "admin"
  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members])
  const selectedShift = shifts.find((shift) => shift.id === selectedShiftId && memberIds.has(shift.memberId)) ?? null
  const allShiftTemplates = useMemo(
    () => ({ ...shiftTemplates, ...customShiftTemplates }),
    [customShiftTemplates],
  )
  const memberName = (memberId: string) => members.find((member) => member.id === memberId)?.name ?? ""

  const departments = useMemo(() => {
    return Array.from(new Set(members.map((member) => member.department).filter(Boolean))).sort()
  }, [members])

  const dateTabs = useMemo(() => {
    if (!shiftPage) return []
    return Array.from({ length: dateDiff(shiftPage.startDate, shiftPage.endDate) + 1 }, (_, index) =>
      addDays(shiftPage.startDate, index),
    )
  }, [shiftPage])

  const draftMembers = useMemo(() => {
    if (!showSelectedMembersOnly) return members
    return members.filter((member) => pageDraft.memberIds.includes(member.id))
  }, [members, pageDraft.memberIds, showSelectedMembersOnly])

  const invitedMembers = useMemo(() => {
    if (!shiftPage) return []
    const query = memberSearch.trim().toLowerCase()
    const invited = members.filter((member) => shiftPage.memberIds.includes(member.id))
    const filteredByDepartment =
      departmentFilter === ALL_DEPARTMENTS ? invited : invited.filter((member) => member.department === departmentFilter)
    if (!query) return filteredByDepartment
    return filteredByDepartment.filter((member) =>
      [member.name, member.department, member.role].some((value) => value.toLowerCase().includes(query)),
    )
  }, [departmentFilter, memberSearch, members, shiftPage])

  const selectedDateShifts = useMemo(() => {
    if (!shiftPage) return []
    return shifts.filter(
      (shift) => shift.date === selectedDate && shiftPage.memberIds.includes(shift.memberId) && memberIds.has(shift.memberId),
    )
  }, [memberIds, selectedDate, shiftPage, shifts])

  const selectedMember = selectedShift
    ? members.find((member) => member.id === selectedShift.memberId)
    : null

  const selectedTemplate = selectedShift ? allShiftTemplates[selectedShift.templateId] : null
  const draftTemplate = draftShift ? allShiftTemplates[draftShift.templateId] : null
  const movingShift = moving ? shifts.find((shift) => shift.id === moving.id) ?? null : null
  const selectedDateIsStart = shiftPage?.startDate === selectedDate
  const selectedDateIsEnd = shiftPage?.endDate === selectedDate
  const selectedDateIsMiddle = Boolean(shiftPage && !selectedDateIsStart && !selectedDateIsEnd)

  const toggleInvitedMember = (memberId: string) => {
    setPageDraft((prev) => {
      const memberIds = prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId]
      return { ...prev, memberIds }
    })
  }

  const createShiftPage = () => {
    const startDate = pageDraft.startDate
    const endDate = pageDraft.endDate < startDate ? startDate : pageDraft.endDate
    const activeMemberIds = pageDraft.memberIds.filter((id) => memberIds.has(id))
    const memberIdsForPage = activeMemberIds.length > 0 ? activeMemberIds : members[0] ? [members[0].id] : []
    const nextPage = { memberIds: memberIdsForPage, startDate, endDate }
    setShiftPages((prev) => {
      setSelectedPageIndex(prev.length)
      return [...prev, nextPage]
    })
    setShiftPage(nextPage)
    setSelectedDate(startDate)
    setDepartmentFilter(ALL_DEPARTMENTS)
  }

  const openShiftPage = (page: ShiftPage, index: number) => {
    setSelectedPageIndex(index)
    setShiftPage(page)
    setSelectedDate(page.startDate)
    setDepartmentFilter(ALL_DEPARTMENTS)
  }

  const getSlotFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return Math.min(
      Math.max(Math.floor((event.clientX - rect.left) / SLOT_WIDTH), 0),
      timeSlots.length - 1,
    )
  }

  const setShiftsWithoutHistory = (nextShifts: Shift[]) => {
    shiftsRef.current = nextShifts
    setShifts(nextShifts)
  }

  const recordShiftsChange = (updater: (current: Shift[]) => Shift[]) => {
    const current = shiftsRef.current
    const next = updater(current)
    if (shiftsEqual(current, next)) return
    historyRef.current = {
      past: [...historyRef.current.past, current].slice(-100),
      future: [],
    }
    setShiftsWithoutHistory(next)
  }

  const commitShiftPreview = (initialShiftsSnapshot: Shift[] | null) => {
    if (!initialShiftsSnapshot || shiftsEqual(initialShiftsSnapshot, shiftsRef.current)) return
    historyRef.current = {
      past: [...historyRef.current.past, initialShiftsSnapshot].slice(-100),
      future: [],
    }
  }

  const undoShifts = () => {
    const previous = historyRef.current.past.at(-1)
    if (!previous) return
    historyRef.current = {
      past: historyRef.current.past.slice(0, -1),
      future: [shiftsRef.current, ...historyRef.current.future],
    }
    setSelectedShiftId(null)
    setDraftShift(null)
    setMoving(null)
    setResizing(null)
    setShiftsWithoutHistory(previous)
  }

  const redoShifts = () => {
    const next = historyRef.current.future[0]
    if (!next) return
    historyRef.current = {
      past: [...historyRef.current.past, shiftsRef.current].slice(-100),
      future: historyRef.current.future.slice(1),
    }
    setSelectedShiftId(null)
    setDraftShift(null)
    setMoving(null)
    setResizing(null)
    setShiftsWithoutHistory(next)
  }

  const updateShift = (id: string, update: Partial<Shift>) => {
    recordShiftsChange((prev) => prev.map((shift) => (shift.id === id ? { ...shift, ...update } : shift)))
  }

  const beginCreateShift = (memberId: string, event: PointerEvent<HTMLButtonElement>) => {
    if (!isAdmin || !shiftPage) return
    const slot = getSlotFromPointer(event)
    if (isSlotOccupied(shiftsRef.current, memberId, selectedDate, slot)) {
      setHoveredSlot(null)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setHoveredSlot({ memberId, slot })
    setCreatingShift({ memberId, startSlot: slot, currentSlot: slot })
  }

  const moveCreateShift = (memberId: string, event: PointerEvent<HTMLButtonElement>) => {
    if (!isAdmin) return
    const slot = getSlotFromPointer(event)
    const occupied = isSlotOccupied(shiftsRef.current, memberId, selectedDate, slot)
    setHoveredSlot(occupied ? null : { memberId, slot })
    setCreatingShift((prev) =>
      prev && prev.memberId === memberId
        ? { ...prev, currentSlot: getAllowedCreateSlot(shiftsRef.current, memberId, selectedDate, prev.startSlot, slot) }
        : prev,
    )
  }

  const finishCreateShift = (memberId: string) => {
    if (!creatingShift || creatingShift.memberId !== memberId) return
    const startSlot = Math.min(creatingShift.startSlot, creatingShift.currentSlot)
    const endSlot = Math.max(creatingShift.startSlot, creatingShift.currentSlot) + 1
    const start = START_MINUTES + startSlot * SLOT_MINUTES
    const end = START_MINUTES + endSlot * SLOT_MINUTES
    setDraftShift({
      memberId,
      date: selectedDate,
      start,
      end: clampShiftEnd(end, start),
      templateId: DEFAULT_SHIFT_TEMPLATE_ID,
      note: allShiftTemplates[DEFAULT_SHIFT_TEMPLATE_ID].note,
    })
    setCreatingShift(null)
    setHoveredSlot(null)
  }

  const cancelCreateShift = () => {
    setCreatingShift(null)
    setHoveredSlot(null)
  }

  const getCreatePreview = (memberId: string) => {
    if (!creatingShift || creatingShift.memberId !== memberId) return null
    const startSlot = Math.min(creatingShift.startSlot, creatingShift.currentSlot)
    const endSlot = Math.max(creatingShift.startSlot, creatingShift.currentSlot) + 1
    return {
      left: TIMELINE_PADDING_WIDTH + startSlot * SLOT_WIDTH,
      width: Math.max((endSlot - startSlot) * SLOT_WIDTH, SLOT_WIDTH),
      start: START_MINUTES + startSlot * SLOT_MINUTES,
      end: START_MINUTES + endSlot * SLOT_MINUTES,
    }
  }

  const createDraftShift = () => {
    if (!draftShift) return
    const template = allShiftTemplates[draftShift.templateId]
    const shift: Shift = {
      id: crypto.randomUUID(),
      memberId: draftShift.memberId,
      date: draftShift.date,
      start: draftShift.start,
      end: draftShift.end,
      templateId: draftShift.templateId,
      kind: template.kind,
      note: draftShift.note.trim() || template.note,
    }
    recordShiftsChange((prev) => [...prev, shift])
    setDraftShift(null)
  }

  const createQuickShift = () => {
    const template = allShiftTemplates[quickShiftDraft.templateId]
    if (!template || !quickShiftDraft.memberId || !shiftPage) return
    const start = quickShiftDraft.start
    const end = clampShiftEnd(quickShiftDraft.end, start)
    const shift: Shift = {
      id: crypto.randomUUID(),
      memberId: quickShiftDraft.memberId,
      date: selectedDate,
      start,
      end,
      templateId: quickShiftDraft.templateId,
      kind: template.kind,
      note: quickShiftDraft.note.trim() || template.note,
    }
    recordShiftsChange((prev) => [...prev, shift])
    setQuickShiftDraft((prev) => ({ ...prev, note: "" }))
    setQuickAddOpen(false)
  }

  const createShiftTemplate = () => {
    const label = templateDraft.label.trim()
    if (!label) return
    const id = `custom-${crypto.randomUUID()}`
    setCustomShiftTemplates((prev) => ({
      ...prev,
      [id]: {
        label,
        kind: templateDraft.kind,
        defaultMinutes: templateDraft.defaultMinutes,
        note: templateDraft.note.trim() || label,
      },
    }))
    setTemplateDraft({ label: "", kind: "day", defaultMinutes: 60, note: "" })
    setTemplateDialogOpen(false)
  }

  const getResizeBounds = (shift: Shift, currentShifts = shiftsRef.current) => {
    const siblingShifts = currentShifts
      .filter((item) => item.id !== shift.id && item.memberId === shift.memberId && item.date === shift.date)
      .sort((left, right) => left.start - right.start)
    const previousEnd = siblingShifts.reduce(
      (latestEnd, item) => (item.end <= shift.start ? Math.max(latestEnd, item.end) : latestEnd),
      START_MINUTES,
    )
    const nextStart = siblingShifts.reduce(
      (earliestStart, item) => (item.start >= shift.end ? Math.min(earliestStart, item.start) : earliestStart),
      END_MINUTES,
    )
    return { previousEnd, nextStart }
  }

  const getMoveBounds = (shift: Shift, currentShifts = shiftsRef.current) => {
    const duration = shift.end - shift.start
    const siblingShifts = currentShifts
      .filter((item) => item.id !== shift.id && item.memberId === shift.memberId && item.date === shift.date)
      .sort((left, right) => left.start - right.start)
    const previousEnd = siblingShifts.reduce(
      (latestEnd, item) => (item.end <= shift.start ? Math.max(latestEnd, item.end) : latestEnd),
      START_MINUTES,
    )
    const nextStart = siblingShifts.reduce(
      (earliestStart, item) => (item.start >= shift.end ? Math.min(earliestStart, item.start) : earliestStart),
      END_MINUTES,
    )
    return {
      minStart: previousEnd,
      maxStart: nextStart - duration,
    }
  }

  const startMove = (shift: Shift, event: PointerEvent<HTMLDivElement>) => {
    if (!isAdmin) return
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.setPointerCapture(event.pointerId)
    moveInitialShiftsRef.current = shiftsRef.current
    didMoveShiftRef.current = false
    setMoving({
      id: shift.id,
      originX: event.clientX,
      pointerOffsetX: event.clientX - rect.left,
      pointerX: event.clientX,
      pointerY: event.clientY,
      start: shift.start,
      end: shift.end,
      previewMemberId: shift.memberId,
    })
  }

  const moveShift = (event: PointerEvent<HTMLDivElement>) => {
    if (!moving) return
    const shift = shiftsRef.current.find((item) => item.id === moving.id)
    if (!shift) return
    const previewMemberId = getMemberIdFromPointer(event) ?? moving.previewMemberId
    const deltaSlots = Math.round((event.clientX - moving.originX) / SLOT_WIDTH)
    if (deltaSlots !== 0) {
      didMoveShiftRef.current = true
    }
    const duration = moving.end - moving.start
    const { minStart, maxStart } = getMoveBounds({ ...shift, start: moving.start, end: moving.end })
    if (maxStart < minStart) return
    const start = Math.min(Math.max(moving.start + deltaSlots * SLOT_MINUTES, minStart), maxStart)
    setShiftsWithoutHistory(
      shiftsRef.current.map((item) =>
        item.id === moving.id ? { ...item, start, end: start + duration } : item,
      ),
    )
    setMoving((prev) => (prev ? { ...prev, pointerX: event.clientX, pointerY: event.clientY, previewMemberId } : prev))
  }

  const stopMove = (event: PointerEvent<HTMLDivElement>) => {
    if (moving) {
      const shift = shiftsRef.current.find((item) => item.id === moving.id)
      const memberId = getMemberIdFromPointer(event)
      if (shift && memberId && memberId !== shift.memberId) {
        const duration = shift.end - shift.start
        const { minStart, maxStart } = getMoveBounds({ ...shift, memberId })
        if (maxStart >= minStart) {
          const start = Math.min(Math.max(shift.start, minStart), maxStart)
          didMoveShiftRef.current = true
          setShiftsWithoutHistory(
            shiftsRef.current.map((item) =>
              item.id === moving.id ? { ...item, memberId, start, end: start + duration } : item,
            ),
          )
        }
      }
    }
    commitShiftPreview(moveInitialShiftsRef.current)
    moveInitialShiftsRef.current = null
    setMoving(null)
  }

  const cancelMove = () => {
    if (moveInitialShiftsRef.current) {
      setShiftsWithoutHistory(moveInitialShiftsRef.current)
    }
    moveInitialShiftsRef.current = null
    didMoveShiftRef.current = false
    setMoving(null)
  }

  const startResize = (shift: Shift, edge: ResizeEdge, event: PointerEvent<HTMLSpanElement>) => {
    if (!isAdmin) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeInitialShiftsRef.current = shiftsRef.current
    didResizeShiftRef.current = false
    setResizing({ id: shift.id, edge, originX: event.clientX, start: shift.start, end: shift.end })
  }

  const moveResize = (event: PointerEvent<HTMLElement>) => {
    if (!resizing) return
    const shift = shiftsRef.current.find((item) => item.id === resizing.id)
    if (!shift) return
    const deltaSlots = Math.round((event.clientX - resizing.originX) / SLOT_WIDTH)
    if (deltaSlots !== 0) {
      didResizeShiftRef.current = true
    }
    const deltaMinutes = deltaSlots * SLOT_MINUTES
    const { previousEnd, nextStart } = getResizeBounds({ ...shift, start: resizing.start, end: resizing.end })
    const update =
      resizing.edge === "start"
        ? {
          start: Math.min(Math.max(resizing.start + deltaMinutes, previousEnd), resizing.end - SLOT_MINUTES),
        }
        : {
          end: Math.max(Math.min(resizing.end + deltaMinutes, nextStart), resizing.start + SLOT_MINUTES),
        }
    setShiftsWithoutHistory(
      shiftsRef.current.map((item) => (item.id === resizing.id ? { ...item, ...update } : item)),
    )
  }

  const stopResize = () => {
    commitShiftPreview(resizeInitialShiftsRef.current)
    resizeInitialShiftsRef.current = null
    setResizing(null)
  }

  const cancelResize = () => {
    if (resizeInitialShiftsRef.current) {
      setShiftsWithoutHistory(resizeInitialShiftsRef.current)
    }
    resizeInitialShiftsRef.current = null
    didResizeShiftRef.current = false
    setResizing(null)
  }

  const openShiftDetail = (id: string) => {
    if (didMoveShiftRef.current || didResizeShiftRef.current) {
      didMoveShiftRef.current = false
      didResizeShiftRef.current = false
      return
    }
    setSelectedShiftId(id)
  }

  const deleteSelectedShift = () => {
    if (!selectedShift) return
    recordShiftsChange((prev) => prev.filter((shift) => shift.id !== selectedShift.id))
    setSelectedShiftId(null)
  }

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!event.metaKey || event.altKey || event.ctrlKey || event.key.toLowerCase() !== "z") return
      if (isTextEditingTarget(event.target)) return
      event.preventDefault()
      if (event.shiftKey) {
        redoShifts()
      } else {
        undoShifts()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <CalendarDays className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">シフト管理</h1>
        {shiftPage ? (
          <>
            <Select value={accountId} onValueChange={(value) => value !== null && setAccountId(value)}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue>{account.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDate} onValueChange={(value) => value !== null && setSelectedDate(value)}>
              <SelectTrigger className="h-8 w-auto max-w-full bg-background">
                <div className="flex min-w-0 items-center gap-1 text-sm">
                  <span className={selectedDateIsStart ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {formatDate(shiftPage.startDate)}
                  </span>
                  {selectedDateIsMiddle ? (
                    <>
                      <span className="text-muted-foreground">〜</span>
                      <span className="font-semibold text-foreground">{formatDate(selectedDate)}</span>
                    </>
                  ) : null}
                  <span className="text-muted-foreground">〜</span>
                  <span className={selectedDateIsEnd ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {formatDate(shiftPage.endDate)}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {dateTabs.map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDate(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shiftPages.map((page, index) => (
              <Button key={`${page.startDate}-${page.endDate}-${index}`} type="button" size="sm" variant={index === selectedPageIndex ? "default" : "outline"} onClick={() => openShiftPage(page, index)}>
                {index + 1}
              </Button>
            ))}
            {isAdmin ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
                種類追加
              </Button>
            ) : null}
            {quickAddOpen ? (
              <div className="grid w-full gap-2 lg:w-auto lg:grid-cols-[10rem_10rem_7rem_7rem_12rem]">
                <Select value={quickShiftDraft.memberId} onValueChange={(value) => value !== null && setQuickShiftDraft((prev) => ({ ...prev, memberId: value }))}>
                  <SelectTrigger className="h-8 w-full"><SelectValue>{memberName(quickShiftDraft.memberId) || "メンバー"}</SelectValue></SelectTrigger>
                  <SelectContent>{members.map((member) => <SelectItem key={`header-quick-member-${member.id}`} value={member.id}>{member.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={quickShiftDraft.templateId} onValueChange={(value) => value !== null && setQuickShiftDraft((prev) => ({ ...prev, templateId: value as ShiftTemplateId }))}>
                  <SelectTrigger className="h-8 w-full"><SelectValue>{allShiftTemplates[quickShiftDraft.templateId]?.label ?? "種類"}</SelectValue></SelectTrigger>
                  <SelectContent>{Object.keys(allShiftTemplates).map((templateId) => <SelectItem key={`header-quick-template-${templateId}`} value={templateId}>{allShiftTemplates[templateId].label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={formatTime(quickShiftDraft.start)} onValueChange={(value) => {
                  if (value !== null) {
                    const start = parseTime(value)
                    setQuickShiftDraft((prev) => ({ ...prev, start, end: clampShiftEnd(Math.max(prev.end, start + SLOT_MINUTES), start) }))
                  }
                }}>
                  <SelectTrigger className="h-8 w-full"><SelectValue>{formatTime(quickShiftDraft.start)}</SelectValue></SelectTrigger>
                  <SelectContent>{timeOptions.slice(0, -1).map((option) => <SelectItem key={`header-quick-start-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={formatTime(quickShiftDraft.end)} onValueChange={(value) => value !== null && setQuickShiftDraft((prev) => ({ ...prev, end: clampShiftEnd(parseTime(value), prev.start) }))}>
                  <SelectTrigger className="h-8 w-full"><SelectValue>{formatTime(quickShiftDraft.end)}</SelectValue></SelectTrigger>
                  <SelectContent>{timeOptions.slice(1).map((option) => <SelectItem key={`header-quick-end-${option.value}`} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={quickShiftDraft.note} onChange={(event) => setQuickShiftDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="業務・メモ" className="h-8" />
              </div>
            ) : null}
            <Select value={departmentFilter} onValueChange={(value) => value !== null && setDepartmentFilter(value)}>
              <SelectTrigger className="h-8 w-full md:w-44">
                <SelectValue>{departmentFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS}>{ALL_DEPARTMENTS}</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin ? (
              <Button type="button" size="sm" onClick={quickAddOpen ? createQuickShift : () => setQuickAddOpen(true)} disabled={quickAddOpen && !quickShiftDraft.memberId}>
                {quickAddOpen ? "作成" : "シフト追加"}
              </Button>
            ) : null}
            <Button type="button" size="sm" className="bg-black text-white hover:bg-black/80" onClick={() => setShiftPage(null)}>
              <Plus className="size-4" />
              ページ新規作成
            </Button>
          </>
        ) : null}
      </header>

      {!shiftPage ? (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="w-full max-w-4xl shrink-0">
              <h2 className="text-lg font-medium">シフトページ作成</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="page-start">開始日</Label>
                  <Input
                    id="page-start"
                    type="date"
                    value={pageDraft.startDate}
                    onChange={(event) =>
                      setPageDraft((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                        endDate: prev.endDate < event.target.value ? event.target.value : prev.endDate,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="page-end">終了日</Label>
                  <Input
                    id="page-end"
                    type="date"
                    value={pageDraft.endDate}
                    min={pageDraft.startDate}
                    onChange={(event) => setPageDraft((prev) => ({ ...prev, endDate: event.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              <Label className="shrink-0">招待するメンバー</Label>
              <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {draftMembers.map((member) => {
                  const selected = pageDraft.memberIds.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleInvitedMember(member.id)}
                      className={`cursor-pointer rounded-lg border p-3 text-left text-sm transition ${selected ? "border-primary bg-primary/10" : "bg-background hover:bg-muted"
                        }`}
                    >
                      <span className="block font-medium">{member.name}</span>
                      <span className="mt-1 block text-muted-foreground">
                        {member.department} / {member.role}
                      </span>
                    </button>
                  )
                })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-card p-4">
            <button
              type="button"
              onClick={() => setShowSelectedMembersOnly((prev) => !prev)}
              className="cursor-pointer rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {pageDraft.memberIds.length}名を選択中
            </button>
            <Button type="button" className="bg-black text-white hover:bg-black/80" onClick={createShiftPage}>
              <Plus className="size-4" />
              ページ新規作成
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="hidden">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              {isAdmin ? (
                <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
                  種類追加
                </Button>
              ) : null}
              {quickAddOpen ? (
                <div className="grid gap-2 lg:grid-cols-[10rem_10rem_7rem_7rem_12rem]">
                  <Select
                    value={quickShiftDraft.memberId}
                    onValueChange={(value) => {
                      if (value !== null) setQuickShiftDraft((prev) => ({ ...prev, memberId: value }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{memberName(quickShiftDraft.memberId) || "メンバー"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={`quick-member-${member.id}`} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={quickShiftDraft.templateId}
                    onValueChange={(value) => {
                      if (value !== null) setQuickShiftDraft((prev) => ({ ...prev, templateId: value as ShiftTemplateId }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{allShiftTemplates[quickShiftDraft.templateId]?.label ?? "種類"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(allShiftTemplates).map((templateId) => (
                        <SelectItem key={`quick-template-${templateId}`} value={templateId}>
                          {allShiftTemplates[templateId].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formatTime(quickShiftDraft.start)}
                    onValueChange={(value) => {
                      if (value !== null) {
                        const start = parseTime(value)
                        setQuickShiftDraft((prev) => ({ ...prev, start, end: clampShiftEnd(Math.max(prev.end, start + SLOT_MINUTES), start) }))
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatTime(quickShiftDraft.start)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.slice(0, -1).map((option) => (
                        <SelectItem key={`quick-start-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formatTime(quickShiftDraft.end)}
                    onValueChange={(value) => {
                      if (value !== null) setQuickShiftDraft((prev) => ({ ...prev, end: clampShiftEnd(parseTime(value), prev.start) }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatTime(quickShiftDraft.end)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.slice(1).map((option) => (
                        <SelectItem key={`quick-end-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={quickShiftDraft.note}
                    onChange={(event) => setQuickShiftDraft((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder="業務・メモ"
                  />
                </div>
              ) : null}
              <Select
                value={departmentFilter}
                onValueChange={(value) => {
                  if (value !== null) setDepartmentFilter(value)
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue>{departmentFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_DEPARTMENTS}>{ALL_DEPARTMENTS}</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin ? (
                <Button
                  type="button"
                  onClick={quickAddOpen ? createQuickShift : () => setQuickAddOpen(true)}
                  disabled={quickAddOpen && !quickShiftDraft.memberId}
                >
                  <Plus className="size-4" />
                  追加
                </Button>
              ) : null}
            </div>
          </section>

          <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
            <div className="grid min-w-300 grid-cols-[15rem_1fr]">
              <div className="sticky left-0 top-0 z-30 border-b border-r bg-card p-3">
                <Input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="名前検索"
                  className="h-8 bg-background"
                />
              </div>
              <div className="sticky top-0 z-20 border-b bg-card py-3">
                <div className="relative h-10" style={{ width: TIMELINE_TRACK_WIDTH }}>
                  {timeOptions.map((slot, index) => {
                    const isMajor = (slot.minutes - START_MINUTES) % 120 === 0
                    const isHovered = hoveredSlot?.slot === index
                    const isNearHovered =
                      hoveredSlot !== null && hoveredSlot.slot !== index && Math.abs(hoveredSlot.slot - index) <= 2
                    return (
                      <span
                        key={`time-slot-${slot.value}`}
                        className={`absolute top-1 -translate-x-1/2 whitespace-nowrap text-xs transition ${isHovered
                            ? "font-semibold text-foreground opacity-100"
                            : isNearHovered
                              ? "text-muted-foreground opacity-0"
                              : isMajor
                                ? "text-muted-foreground opacity-100"
                                : "text-muted-foreground opacity-0"
                          }`}
                        style={{ left: TIMELINE_PADDING_WIDTH + index * SLOT_WIDTH }}
                      >
                        {slot.label}
                      </span>
                    )
                  })}
                </div>
              </div>

              {invitedMembers.map((member) => {
                const movingPreviewShift = moving
                  ? selectedDateShifts.find((shift) => shift.id === moving.id) ?? null
                  : null
                const memberShifts = selectedDateShifts.filter((shift) => shift.memberId === member.id)
                const visibleMemberShifts =
                  movingPreviewShift && moving?.previewMemberId === member.id && movingPreviewShift.memberId !== member.id
                    ? [...memberShifts, { ...movingPreviewShift, memberId: member.id }]
                    : memberShifts
                const createPreview = getCreatePreview(member.id)
                return (
                  <div key={`member-row-${member.id}`} className="contents">
                    <div className="sticky left-0 z-10 border-r border-b bg-card p-4">
                      <div className="font-medium">{member.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {member.department} / {member.role}
                      </div>
                    </div>
                    <div className="border-b py-3">
                      <div className="relative h-16" style={{ width: TIMELINE_TRACK_WIDTH }}>
                        <button
                          type="button"
                          disabled={!isAdmin}
                          data-shift-member-id={member.id}
                          onPointerDown={(event) => beginCreateShift(member.id, event)}
                          onPointerMove={(event) => moveCreateShift(member.id, event)}
                          onPointerUp={() => finishCreateShift(member.id)}
                          onPointerCancel={cancelCreateShift}
                          onPointerLeave={() => {
                            if (!creatingShift || creatingShift.memberId !== member.id) {
                              setHoveredSlot(null)
                            }
                          }}
                          className="absolute inset-y-0 rounded-lg border border-dashed border-border/80 text-left transition enabled:cursor-copy enabled:hover:bg-muted/30 disabled:cursor-default"
                          style={{
                            left: TIMELINE_PADDING_WIDTH,
                            width: TIMELINE_WIDTH,
                            backgroundImage:
                              "repeating-linear-gradient(to right, transparent 0, transparent 15px, color-mix(in oklch, var(--border), transparent 35%) 15px, color-mix(in oklch, var(--border), transparent 35%) 16px)",
                          }}
                          aria-label={`${member.name}のシフトを追加`}
                        >
                          {memberShifts.map((shift) => {
                            const blockedLeft = ((shift.start - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
                            const blockedWidth = ((shift.end - shift.start) / SLOT_MINUTES) * SLOT_WIDTH
                            return (
                              <span
                                key={`blocked-slot-${shift.id}`}
                                className="absolute inset-y-0 cursor-not-allowed"
                                style={{ left: blockedLeft, width: blockedWidth }}
                                onPointerDown={(event) => event.stopPropagation()}
                                onPointerEnter={() => setHoveredSlot(null)}
                                onPointerMove={(event) => event.stopPropagation()}
                                onPointerUp={(event) => event.stopPropagation()}
                                aria-hidden="true"
                              />
                            )
                          })}
                          {hoveredSlot?.memberId === member.id ? (
                            <span
                              className={`pointer-events-none absolute inset-y-0 border-r bg-muted ${getHoveredSlotRadiusClass(hoveredSlot.slot)}`}
                              style={{
                                left: hoveredSlot.slot * SLOT_WIDTH,
                                width: SLOT_WIDTH,
                                borderRightColor: "color-mix(in oklch, var(--border), transparent 35%)",
                              }}
                            />
                          ) : null}
                        </button>
                        {createPreview ? (
                          <div
                            className={`pointer-events-none absolute top-2 box-border h-12 overflow-hidden rounded-md border text-left ${createPreview.width === SLOT_WIDTH ? "px-0" : "px-3 shadow-sm"} ${shiftKinds.day.className}`}
                            style={{
                              left: createPreview.left,
                              width: createPreview.width,
                              minWidth: createPreview.width,
                              maxWidth: createPreview.width,
                            }}
                          >
                            {createPreview.width > SLOT_WIDTH ? (
                              <>
                                <span className="block truncate text-sm font-medium">
                                  {formatTime(createPreview.start)}-{formatTime(createPreview.end)}
                                </span>
                                <span className="block truncate text-xs opacity-80">
                                  {allShiftTemplates[DEFAULT_SHIFT_TEMPLATE_ID].label}
                                </span>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="pointer-events-none relative -mt-16 h-16" style={{ width: TIMELINE_TRACK_WIDTH }}>
                        {visibleMemberShifts.map((shift) => {
                          const left =
                            TIMELINE_PADDING_WIDTH + ((shift.start - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
                          const width = ((shift.end - shift.start) / SLOT_MINUTES) * SLOT_WIDTH
                          const visualWidth = width + 1
                          const template = allShiftTemplates[shift.templateId]
                          const isSingleSlotShift = shift.end - shift.start === SLOT_MINUTES
                          const isMovingShift = moving?.id === shift.id
                          const isMovingAlias = isMovingShift && movingPreviewShift?.memberId !== shift.memberId
                          const isMovingSource = isMovingShift && !isMovingAlias
                          const isMovingSourceAlias = isMovingSource && moving?.previewMemberId === shift.memberId
                          const isHiddenMovingSource = isMovingSource && !isMovingSourceAlias
                          return (
                            <Fragment key={shift.id}>
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (!isMovingAlias) openShiftDetail(shift.id)
                                }}
                                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    openShiftDetail(shift.id)
                                  }
                                }}
                                onPointerDown={(event) => {
                                  if (!isMovingAlias) startMove(shift, event)
                                }}
                                onPointerMove={(event) => {
                                  moveShift(event)
                                  moveResize(event)
                                }}
                                onPointerUp={(event) => {
                                  stopMove(event)
                                  stopResize()
                                }}
                                onPointerCancel={() => {
                                  cancelMove()
                                  cancelResize()
                                }}
                                aria-label={`${member.name} ${formatTime(shift.start)}-${formatTime(shift.end)}の詳細`}
                                className={`${isMovingAlias ? "pointer-events-none" : "pointer-events-auto"} absolute top-2 box-border h-12 select-none overflow-hidden rounded-md border text-left transition hover:z-30 hover:ring-2 hover:ring-inset hover:ring-ring/40 ${isHiddenMovingSource ? "opacity-0" : ""} ${isMovingAlias || isMovingSourceAlias ? "opacity-40 ring-2 ring-inset ring-ring/30" : ""} ${isSingleSlotShift ? "px-0" : "px-3 shadow-sm"} ${shiftKinds[shift.kind].className} ${isAdmin && !isMovingAlias ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                                  }`}
                                style={{ left, width: visualWidth, minWidth: visualWidth, maxWidth: visualWidth }}
                              >
                                {isSingleSlotShift ? null : (
                                  <>
                                    <span className="block select-none truncate text-sm font-medium">
                                      {formatTime(shift.start)}-{formatTime(shift.end)}
                                    </span>
                                    <span className="block select-none truncate text-xs opacity-80">{shift.note || template.label}</span>
                                  </>
                                )}
                              </div>
                              {isAdmin && !isMovingAlias ? (
                                <>
                                  <span
                                    className={`pointer-events-auto absolute top-3 z-40 h-10 w-2 cursor-ew-resize rounded-l-md transition hover:bg-foreground/15 active:bg-foreground/20 ${isMovingShift ? "opacity-0" : ""}`}
                                    style={{ left: left - 4 }}
                                    onClick={(event) => event.stopPropagation()}
                                    onPointerDown={(event) => startResize(shift, "start", event)}
                                    onPointerMove={(event) => moveResize(event)}
                                    onPointerUp={stopResize}
                                    onPointerCancel={cancelResize}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className={`pointer-events-auto absolute top-3 z-40 h-10 w-2 cursor-ew-resize rounded-r-md transition hover:bg-foreground/15 active:bg-foreground/20 ${isMovingShift ? "opacity-0" : ""}`}
                                    style={{ left: left + visualWidth - 4 }}
                                    onClick={(event) => event.stopPropagation()}
                                    onPointerDown={(event) => startResize(shift, "end", event)}
                                    onPointerMove={(event) => moveResize(event)}
                                    onPointerUp={stopResize}
                                    onPointerCancel={cancelResize}
                                    aria-hidden="true"
                                  />
                                </>
                              ) : null}
                            </Fragment>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {moving && movingShift ? (
        <div
          className={`pointer-events-none fixed z-50 box-border h-12 select-none overflow-hidden rounded-md border text-left opacity-90 shadow-lg ${movingShift.end - movingShift.start === SLOT_MINUTES ? "px-0" : "px-3"} ${shiftKinds[movingShift.kind].className}`}
          style={{
            left: moving.pointerX - moving.pointerOffsetX,
            top: moving.pointerY - 24,
            width: ((movingShift.end - movingShift.start) / SLOT_MINUTES) * SLOT_WIDTH + 1,
          }}
        >
          {movingShift.end - movingShift.start === SLOT_MINUTES ? null : (
            <>
              <span className="block select-none truncate text-sm font-medium">
                {formatTime(movingShift.start)}-{formatTime(movingShift.end)}
              </span>
              <span className="block select-none truncate text-xs opacity-80">
                {movingShift.note || allShiftTemplates[movingShift.templateId]?.label}
              </span>
            </>
          )}
        </div>
      ) : null}

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>シフト種類作成</DialogTitle>
            <DialogDescription>作成した種類はシフト作成時のプルダウンに追加されます。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="template-label">種類名</Label>
              <Input
                id="template-label"
                value={templateDraft.label}
                onChange={(event) => setTemplateDraft((prev) => ({ ...prev, label: event.target.value }))}
                placeholder="例: 受付ヘルプ"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>色カテゴリ</Label>
                <Select
                  value={templateDraft.kind}
                  onValueChange={(value) => {
                    if (value !== null) setTemplateDraft((prev) => ({ ...prev, kind: value as ShiftKind }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{shiftKinds[templateDraft.kind].label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(shiftKinds) as ShiftKind[]).map((kind) => (
                      <SelectItem key={`template-kind-${kind}`} value={kind}>
                        {shiftKinds[kind].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="template-duration">標準時間（分）</Label>
                <Input
                  id="template-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={templateDraft.defaultMinutes}
                  onChange={(event) =>
                    setTemplateDraft((prev) => ({
                      ...prev,
                      defaultMinutes: Math.max(15, Math.round(Number(event.target.value || 15) / 15) * 15),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="template-note">標準メモ</Label>
              <Input
                id="template-note"
                value={templateDraft.note}
                onChange={(event) => setTemplateDraft((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="例: 受付対応"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="button" onClick={createShiftTemplate} disabled={!templateDraft.label.trim()}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={draftShift !== null} onOpenChange={(open) => !open && setDraftShift(null)}>
        <DialogContent className="sm:max-w-lg">
          {draftShift && draftTemplate ? (
            <>
              <DialogHeader>
                <DialogTitle>シフト作成</DialogTitle>
                <DialogDescription>
                  {memberName(draftShift.memberId)} / {formatDate(draftShift.date)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label>シフト種類</Label>
                  <Select
                    value={draftShift.templateId}
                    onValueChange={(value) => {
                      if (value === null) return
                      const templateId = value as ShiftTemplateId
                      const template = allShiftTemplates[templateId]
                      setDraftShift((prev) =>
                        prev
                          ? {
                            ...prev,
                            templateId,
                            end: clampShiftEnd(prev.start + template.defaultMinutes, prev.start),
                            note: template.note,
                          }
                          : prev,
                      )
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{draftTemplate.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(allShiftTemplates).map((templateId) => (
                        <SelectItem key={templateId} value={templateId}>
                          {allShiftTemplates[templateId].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>開始</Label>
                    <Select
                      value={formatTime(draftShift.start)}
                      onValueChange={(value) => {
                        if (value === null) return
                        const start = parseTime(value)
                        setDraftShift((prev) =>
                          prev
                            ? { ...prev, start, end: clampShiftEnd(Math.max(prev.end, start + SLOT_MINUTES), start) }
                            : prev,
                        )
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{formatTime(draftShift.start)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.slice(0, -1).map((option) => (
                          <SelectItem key={`draft-start-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>終了</Label>
                    <Select
                      value={formatTime(draftShift.end)}
                      onValueChange={(value) => {
                        if (value === null) return
                        setDraftShift((prev) => (prev ? { ...prev, end: clampShiftEnd(parseTime(value), prev.start) } : prev))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{formatTime(draftShift.end)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.slice(1).map((option) => (
                          <SelectItem key={`draft-end-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="draft-note">業務・メモ</Label>
                  <Input
                    id="draft-note"
                    value={draftShift.note}
                    onChange={(event) => setDraftShift((prev) => (prev ? { ...prev, note: event.target.value } : prev))}
                    placeholder="例: 受付、会場準備など"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDraftShift(null)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={createDraftShift}>
                  作成
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={selectedShift !== null} onOpenChange={(open) => !open && setSelectedShiftId(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedShift && selectedMember && selectedTemplate ? (
            <>
              <DialogHeader>
                <DialogTitle>シフト詳細</DialogTitle>
                <DialogDescription>
                  {selectedMember.name} / {formatDate(selectedShift.date)}
                </DialogDescription>
              </DialogHeader>
              {isAdmin ? (
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1.5">
                    <Label>シフト種類</Label>
                    <Select
                      value={selectedShift.templateId}
                      onValueChange={(value) => {
                        if (value === null) return
                        const templateId = value as ShiftTemplateId
                        const template = allShiftTemplates[templateId]
                        updateShift(selectedShift.id, { templateId, kind: template.kind, note: template.note })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{selectedTemplate.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(allShiftTemplates).map((templateId) => (
                          <SelectItem key={`detail-template-${templateId}`} value={templateId}>
                            {allShiftTemplates[templateId].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label>開始</Label>
                      <Select
                        value={formatTime(selectedShift.start)}
                        onValueChange={(value) => {
                          if (value === null) return
                          const start = parseTime(value)
                          updateShift(selectedShift.id, {
                            start,
                            end: clampShiftEnd(Math.max(selectedShift.end, start + SLOT_MINUTES), start),
                          })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>{formatTime(selectedShift.start)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.slice(0, -1).map((option) => (
                            <SelectItem key={`detail-start-${option.value}`} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>終了</Label>
                      <Select
                        value={formatTime(selectedShift.end)}
                        onValueChange={(value) => {
                          if (value !== null) updateShift(selectedShift.id, { end: clampShiftEnd(parseTime(value), selectedShift.start) })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>{formatTime(selectedShift.end)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.slice(1).map((option) => (
                            <SelectItem key={`detail-end-${option.value}`} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="shift-note">業務・メモ</Label>
                    <Input
                      id="shift-note"
                      value={selectedShift.note}
                      onChange={(event) => updateShift(selectedShift.id, { note: event.target.value })}
                      placeholder="例: 受付、会場準備など"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 py-2 text-sm">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">シフト種類</div>
                    <div className="mt-1 font-medium">{selectedTemplate.label}</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="text-xs text-muted-foreground">開始</div>
                      <div className="mt-1 font-medium">{formatTime(selectedShift.start)}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="text-xs text-muted-foreground">終了</div>
                      <div className="mt-1 font-medium">{formatTime(selectedShift.end)}</div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">業務・メモ</div>
                    <div className="mt-1 font-medium">{selectedShift.note || selectedTemplate.note}</div>
                  </div>
                </div>
              )}
              <DialogFooter>
                {isAdmin ? (
                  <Button type="button" variant="destructive" onClick={deleteSelectedShift}>
                    <Trash2 className="size-4" />
                    削除
                  </Button>
                ) : (
                  <Badge variant="secondary">
                    <Eye className="size-3" />
                    閲覧のみ
                  </Badge>
                )}
                <Button type="button" variant="outline" onClick={() => setSelectedShiftId(null)}>
                  閉じる
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
