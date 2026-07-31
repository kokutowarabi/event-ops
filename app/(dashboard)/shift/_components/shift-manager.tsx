import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
} from "react"
import { createPortal } from "react-dom"
import { CalendarDays, Check, Download, Layers3, ListFilter, Pin, Plus, Users, X } from "lucide-react"
import type { Member } from "@/lib/members"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { downloadCsv } from "@/lib/csv"
import {
  formatCompactDate,
  getOperationPeriodLabel,
  operationPeriod,
} from "@/lib/event-schedule"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { parseMemberRoles } from "@/lib/member-role"
import type {
  Shift,
  ShiftData,
  ShiftSchedule,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { ShiftCreateTimeLabel } from "./shift-create-time-label"
import {
  ShiftAdjustmentDialog,
  ShiftCreationDialog,
  ShiftDetailsDialog,
} from "./shift-dialogs"
import {
  ShiftFilterEmptyState,
  ShiftFilterPicker,
  type FilterPanelPosition,
} from "./shift-filter-ui"
import {
  addDays,
  adjustConflictingShiftRanges,
  canCopyShiftToMember,
  canPlaceShift,
  clampShiftEnd,
  copyShiftForMember,
  COVERAGE_SLOT_MINUTES,
  coverageTimeSlots,
  createShiftTemplateColor,
  dateDiff,
  DEFAULT_SHIFT_TEMPLATE_ID,
  END_MINUTES,
  formatTime,
  getCreateShiftTimeRange,
  getShiftAdjustmentChanges,
  isSlotOccupied,
  orderMemberIdsWithPins,
  shiftsEqual,
  shiftTemplates,
  shouldSplitShiftTimeLabels,
  SLOT_MINUTES,
  START_MINUTES,
  timeOptions,
  timeSlots,
  type ShiftTemplateColor,
} from "./shift-domain"
import {
  getMemberIdFromPointer,
  getMemberRowFromPointer,
  getNearestMemberRowFromPointer,
} from "./shift-pointer"
import type {
  CopyingShift,
  CreatingShift,
  DraftShift,
  DraftShiftTemplate,
  FilterAnchor,
  MovingShift,
  PendingMovePress,
  PendingShiftAdjustment,
  ResizeEdge,
  ResizingShift,
  ShiftViewMode,
} from "./shift-types"

export type { Shift, ShiftData, ShiftSchedule, ShiftTemplate } from "@/lib/shift-data"

const ALL_DEPARTMENTS = "すべてのセクション"
const SLOT_WIDTH = 16
const MOVE_LONG_PRESS_MS = 180
const TIMELINE_PADDING_SLOTS = 2
const TIMELINE_PADDING_WIDTH = TIMELINE_PADDING_SLOTS * SLOT_WIDTH
const TIMELINE_WIDTH = ((END_MINUTES - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
const TIMELINE_TRACK_WIDTH = TIMELINE_WIDTH + TIMELINE_PADDING_WIDTH * 2
const MOBILE_SLOT_HEIGHT = 14
const MOBILE_TIMELINE_PADDING_SLOTS = 2
const MOBILE_TIMELINE_PADDING_HEIGHT = MOBILE_TIMELINE_PADDING_SLOTS * MOBILE_SLOT_HEIGHT
const MOBILE_TIMELINE_HEIGHT = ((END_MINUTES - START_MINUTES) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
const MOBILE_TIMELINE_TRACK_HEIGHT = MOBILE_TIMELINE_HEIGHT + MOBILE_TIMELINE_PADDING_HEIGHT * 2
const DESKTOP_TIMELINE_HEADER_HEIGHT = 64
const DESKTOP_MEMBER_ROW_HEIGHT = 88
const MOBILE_TIMELINE_GRID_BACKGROUND = `repeating-linear-gradient(to bottom, transparent 0, transparent ${MOBILE_SLOT_HEIGHT - 1}px, color-mix(in oklch, var(--border), transparent 35%) ${MOBILE_SLOT_HEIGHT - 1}px, color-mix(in oklch, var(--border), transparent 35%) ${MOBILE_SLOT_HEIGHT}px)`
// MVPでは既存シフトの編集に限定し、新規作成の導線を閉じる。
const SHIFT_CREATION_ENABLED = false
// 個人タイムライン上のD&D作成だけは、15分単位で利用できる。
const SHIFT_DND_CREATION_ENABLED = true

function getHoveredSlotRadiusClass(slot: number) {
  if (slot === 0) return "rounded-l-lg"
  if (slot === timeSlots.length - 1) return "rounded-r-lg"
  return ""
}

function isTextEditingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

type ShiftManagerProps = {
  members: Member[]
  initialShiftData: ShiftData
  onShiftDataChange: (data: ShiftData) => void
}

export function ShiftManager({ members, initialShiftData, onShiftDataChange }: ShiftManagerProps) {
  const defaultStartDate = operationPeriod.startDate
  const [shiftViewMode, setShiftViewMode] = useState<ShiftViewMode>("member")
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule | null>(initialShiftData.schedule)
  const [selectedDate, setSelectedDate] = useState(initialShiftData.schedule?.startDate ?? defaultStartDate)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterAnchor, setFilterAnchor] = useState<FilterAnchor | null>(null)
  const [filterPanelPosition, setFilterPanelPosition] = useState<FilterPanelPosition | null>(null)
  const [shiftFilter, setShiftFilter] = useState("")
  const [memberSearch, setMemberSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState(ALL_DEPARTMENTS)
  const [roleFilter, setRoleFilter] = useState("すべての役職")
  const [pinnedMemberIds, setPinnedMemberIds] = useState<string[]>([])
  const [shifts, setShifts] = useState<Shift[]>(initialShiftData.shifts)
  const [customShiftTemplates, setCustomShiftTemplates] = useState<Record<ShiftTemplateId, ShiftTemplate>>(initialShiftData.customShiftTemplates)
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [draftShift, setDraftShift] = useState<DraftShift | null>(null)
  const [draftBaseShifts, setDraftBaseShifts] = useState<Shift[] | null>(null)
  const [templateDraft, setTemplateDraft] = useState<DraftShiftTemplate>({
    label: "",
    kind: "day",
    defaultMinutes: 60,
    note: "",
  })
  const [moving, setMoving] = useState<MovingShift | null>(null)
  const [resizing, setResizing] = useState<ResizingShift | null>(null)
  const [copying, setCopying] = useState<CopyingShift | null>(null)
  const [pendingShiftAdjustment, setPendingShiftAdjustment] = useState<PendingShiftAdjustment | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<{ memberId: string; slot: number } | null>(null)
  const [creatingShift, setCreatingShift] = useState<CreatingShift | null>(null)
  const shiftsRef = useRef(shifts)
  const historyRef = useRef<{ past: Shift[][]; future: Shift[][] }>({ past: [], future: [] })
  const moveInitialShiftsRef = useRef<Shift[] | null>(null)
  const pendingMovePressRef = useRef<PendingMovePress | null>(null)
  const resizeInitialShiftsRef = useRef<Shift[] | null>(null)
  const createInitialShiftsRef = useRef<Shift[] | null>(null)
  const didMoveShiftRef = useRef(false)
  const didResizeShiftRef = useRef(false)
  const syncedShiftDataRef = useRef(JSON.stringify(initialShiftData))
  const emittedShiftDataRef = useRef(JSON.stringify(initialShiftData))
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null)
  const filterPanelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const nextSignature = JSON.stringify(initialShiftData)
    if (nextSignature === syncedShiftDataRef.current) return
    syncedShiftDataRef.current = nextSignature
    emittedShiftDataRef.current = nextSignature
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setShiftSchedule(initialShiftData.schedule)
      setShifts(initialShiftData.shifts)
      shiftsRef.current = initialShiftData.shifts
      setCustomShiftTemplates(initialShiftData.customShiftTemplates)
      setPendingShiftAdjustment(null)
    })
    return () => {
      cancelled = true
    }
  }, [initialShiftData])

  useEffect(() => () => {
    const pending = pendingMovePressRef.current
    if (pending) window.clearTimeout(pending.timerId)
  }, [])

  useEffect(() => {
    if (creatingShift || moving || resizing || copying) return
    const nextData = { schedule: shiftSchedule, shifts, customShiftTemplates }
    const nextSignature = JSON.stringify(nextData)
    if (nextSignature === emittedShiftDataRef.current) return
    emittedShiftDataRef.current = nextSignature
    onShiftDataChange(nextData)
  }, [copying, creatingShift, customShiftTemplates, moving, onShiftDataChange, resizing, shiftSchedule, shifts])

  const isAdmin = true
  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members])
  const selectedShift = shifts.find((shift) => shift.id === selectedShiftId && memberIds.has(shift.memberId)) ?? null
  const allShiftTemplates = useMemo(
    () => ({ ...shiftTemplates, ...customShiftTemplates }),
    [customShiftTemplates],
  )
  const shiftTemplateColors = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(allShiftTemplates).map((templateId, index) => [
          templateId,
          createShiftTemplateColor(index),
        ]),
      ) as Record<ShiftTemplateId, ShiftTemplateColor>,
    [allShiftTemplates],
  )
  const getShiftTemplateColor = (templateId: ShiftTemplateId) =>
    shiftTemplateColors[templateId] ?? createShiftTemplateColor(0)
  const memberName = (memberId: string) => members.find((member) => member.id === memberId)?.name ?? ""

  const departments = useMemo(() => {
    return Array.from(new Set(members.map((member) => member.department).filter(Boolean))).sort()
  }, [members])
  const roles = useMemo(() => {
    return Array.from(
      new Set(members.flatMap((member) => parseMemberRoles(member.role))),
    ).sort()
  }, [members])

  const dateTabs = useMemo(() => {
    if (!shiftSchedule) return []
    return Array.from({ length: dateDiff(shiftSchedule.startDate, shiftSchedule.endDate) + 1 }, (_, index) =>
      addDays(shiftSchedule.startDate, index),
    )
  }, [shiftSchedule])

  const scheduledMembers = useMemo(() => {
    if (!shiftSchedule) return []
    return members.filter((member) => shiftSchedule.memberIds.includes(member.id))
  }, [members, shiftSchedule])

  const invitedMembers = useMemo(() => {
    if (!shiftSchedule) return []
    const query = memberSearch.trim().toLowerCase()
    const filteredByDepartment =
      departmentFilter === ALL_DEPARTMENTS
        ? scheduledMembers
        : scheduledMembers.filter((member) => member.department === departmentFilter)
    const filteredByRole =
      roleFilter === "すべての役職"
        ? filteredByDepartment
        : filteredByDepartment.filter((member) => parseMemberRoles(member.role).includes(roleFilter))
    if (!query) return filteredByRole
    return filteredByRole.filter((member) =>
      [member.name, member.department, member.role].some((value) => value.toLowerCase().includes(query)),
    )
  }, [departmentFilter, memberSearch, roleFilter, scheduledMembers, shiftSchedule])

  const selectedDateShifts = useMemo(() => {
    if (!shiftSchedule) return []
    return shifts.filter(
      (shift) => shift.date === selectedDate && shiftSchedule.memberIds.includes(shift.memberId) && memberIds.has(shift.memberId),
    )
  }, [memberIds, selectedDate, shiftSchedule, shifts])
  const visibleSelectedDateShifts = useMemo(() => {
    const query = shiftFilter.trim().toLowerCase()
    if (!query) return selectedDateShifts
    return selectedDateShifts.filter((shift) => {
      const template = allShiftTemplates[shift.templateId]
      return [template?.label, shift.note].some((value) => value?.toLowerCase().includes(query))
    })
  }, [allShiftTemplates, selectedDateShifts, shiftFilter])
  const filteredInvitedMembers = useMemo(() => {
    if (!shiftFilter.trim()) return invitedMembers
    const visibleMemberIds = new Set(visibleSelectedDateShifts.map((shift) => shift.memberId))
    return invitedMembers.filter((member) => visibleMemberIds.has(member.id))
  }, [invitedMembers, shiftFilter, visibleSelectedDateShifts])
  const visibleMemberOrder = useMemo(
    () => orderMemberIdsWithPins(
      scheduledMembers.map((member) => member.id),
      filteredInvitedMembers.map((member) => member.id),
      pinnedMemberIds,
    ),
    [filteredInvitedMembers, pinnedMemberIds, scheduledMembers],
  )
  const scheduledMembersById = useMemo(
    () => new Map(scheduledMembers.map((member) => [member.id, member])),
    [scheduledMembers],
  )
  const visibleInvitedMembers = useMemo(
    () => visibleMemberOrder.flatMap((memberId) => {
      const member = scheduledMembersById.get(memberId)
      return member ? [member] : []
    }),
    [scheduledMembersById, visibleMemberOrder],
  )
  const visiblePinnedMemberIds = useMemo(
    () => visibleMemberOrder.filter((memberId) => pinnedMemberIds.includes(memberId)),
    [pinnedMemberIds, visibleMemberOrder],
  )
  const visiblePinnedMemberIdSet = useMemo(
    () => new Set(visiblePinnedMemberIds),
    [visiblePinnedMemberIds],
  )
  const visiblePinnedMembers = useMemo(
    () => visiblePinnedMemberIds.flatMap((memberId) => {
      const member = scheduledMembersById.get(memberId)
      return member ? [member] : []
    }),
    [scheduledMembersById, visiblePinnedMemberIds],
  )
  const exportableShifts = useMemo(() => {
    const visibleMemberIds = new Set(filteredInvitedMembers.map((member) => member.id))
    const memberNames = new Map(members.map((member) => [member.id, member.name]))
    return visibleSelectedDateShifts
      .filter((shift) => visibleMemberIds.has(shift.memberId))
      .sort(
        (left, right) =>
          left.start - right.start
          || (memberNames.get(left.memberId) ?? "").localeCompare(
            memberNames.get(right.memberId) ?? "",
            "ja",
          ),
      )
  }, [filteredInvitedMembers, members, visibleSelectedDateShifts])
  const filterSummary = useMemo(
    () =>
      [
        shiftFilter ? `業務: ${shiftFilter}` : "",
        memberSearch ? `氏名: ${memberSearch}` : "",
        departmentFilter !== ALL_DEPARTMENTS ? `所属: ${departmentFilter}` : "",
        roleFilter !== "すべての役職" ? `役職: ${roleFilter}` : "",
      ]
        .filter(Boolean)
        .join("・"),
    [departmentFilter, memberSearch, roleFilter, shiftFilter],
  )
  const hasActiveFilters = Boolean(
    shiftFilter.trim()
    || memberSearch.trim()
    || departmentFilter !== ALL_DEPARTMENTS
    || roleFilter !== "すべての役職",
  )
  const hasNoFilterResults = hasActiveFilters && filteredInvitedMembers.length === 0
  const shiftFilterOptions = useMemo(() => {
    return [
      ...Object.values(allShiftTemplates).map((template) => template.label),
      ...selectedDateShifts.map((shift) => shift.note),
    ].filter(Boolean)
  }, [allShiftTemplates, selectedDateShifts])
  const assignmentCoverage = useMemo(() => {
    return Object.entries(allShiftTemplates)
      .map(([templateId, template]) => {
        const assignments = selectedDateShifts
          .filter((shift) => shift.templateId === templateId)
          .sort((left, right) => left.start - right.start || left.memberId.localeCompare(right.memberId))
        const slotCounts = coverageTimeSlots.map((slotStart) => {
          const slotEnd = slotStart + COVERAGE_SLOT_MINUTES
          return assignments.filter((shift) => shift.start < slotEnd && shift.end > slotStart).length
        })
        return {
          templateId,
          template,
          assignments,
          slotCounts,
          maxOverlap: Math.max(0, ...slotCounts),
          totalMinutes: assignments.reduce((total, shift) => total + shift.end - shift.start, 0),
          memberCount: new Set(assignments.map((shift) => shift.memberId)).size,
        }
      })
      .filter((group) => group.assignments.length > 0)
      .sort((left, right) => right.maxOverlap - left.maxOverlap || left.template.label.localeCompare(right.template.label, "ja"))
  }, [allShiftTemplates, selectedDateShifts])

  const currentDraftBaseShifts = draftBaseShifts ?? shifts
  const draftConflictResolution = draftShift
    ? adjustConflictingShiftRanges(
      currentDraftBaseShifts,
      draftShift.memberId,
      draftShift.date,
      draftShift.start,
      draftShift.end,
    )
    : null
  const draftAdjustmentChanges = draftConflictResolution
    ? getShiftAdjustmentChanges(currentDraftBaseShifts, draftConflictResolution.shifts)
    : []
  const movingShift = moving ? shifts.find((shift) => shift.id === moving.id) ?? null : null
  const copyingShift = copying ? shifts.find((shift) => shift.id === copying.sourceId) ?? null : null
  const exportShifts = () => {
    const membersById = new Map(members.map((member) => [member.id, member]))
    downloadCsv(
      `シフト_${selectedDate}`,
      ["日付", "氏名", "メールアドレス", "所属", "役職", "業務", "開始時刻", "終了時刻", "時間（分）", "メモ"],
      exportableShifts.map((shift) => {
        const member = membersById.get(shift.memberId)
        return [
          shift.date,
          member?.name,
          member?.email,
          member?.department,
          member?.role,
          allShiftTemplates[shift.templateId]?.label ?? shift.templateId,
          formatTime(shift.start),
          formatTime(shift.end),
          shift.end - shift.start,
          shift.note,
        ]
      }),
    )
  }

  const getSlotFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return Math.min(
      Math.max(Math.floor((event.clientX - rect.left) / SLOT_WIDTH), 0),
      timeSlots.length - 1,
    )
  }

  const getMobileSlotFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return Math.min(
      Math.max(Math.floor((event.clientY - rect.top) / MOBILE_SLOT_HEIGHT), 0),
      timeSlots.length - 1,
    )
  }

  const beginCreateMobileShift = (memberId: string, event: PointerEvent<HTMLButtonElement>) => {
    if (!isAdmin || !shiftSchedule) return
    const slot = getMobileSlotFromPointer(event)
    if (isSlotOccupied(shiftsRef.current, memberId, selectedDate, slot)) {
      setHoveredSlot(null)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    createInitialShiftsRef.current = shiftsRef.current
    setHoveredSlot({ memberId, slot })
    setCreatingShift({ memberId, startSlot: slot, currentSlot: slot, adjustedShiftIds: [] })
  }

  const moveCreateMobileShift = (memberId: string, event: PointerEvent<HTMLButtonElement>) => {
    if (!isAdmin || !creatingShift || creatingShift.memberId !== memberId) return
    const slot = getMobileSlotFromPointer(event)
    const { start, end } = getCreateShiftTimeRange(creatingShift.startSlot, slot)
    const baseShifts = createInitialShiftsRef.current ?? shiftsRef.current
    const conflictResolution = adjustConflictingShiftRanges(
      baseShifts,
      memberId,
      selectedDate,
      start,
      end,
    )
    if (!conflictResolution) {
      setHoveredSlot(null)
      return
    }
    setShiftsWithoutHistory(conflictResolution.shifts)
    setHoveredSlot({ memberId, slot })
    setCreatingShift({
      ...creatingShift,
      currentSlot: slot,
      adjustedShiftIds: conflictResolution.adjustedShiftIds,
    })
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
    setDraftBaseShifts(null)
    setMoving(null)
    setResizing(null)
    setPendingShiftAdjustment(null)
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
    setDraftBaseShifts(null)
    setMoving(null)
    setResizing(null)
    setPendingShiftAdjustment(null)
    setShiftsWithoutHistory(next)
  }

  const updateShift = (id: string, update: Partial<Shift>) => {
    recordShiftsChange((prev) => prev.map((shift) => (shift.id === id ? { ...shift, ...update } : shift)))
  }

  const beginCreateShift = (memberId: string, event: PointerEvent<HTMLButtonElement>) => {
    if (!isAdmin || !shiftSchedule) return
    const slot = getSlotFromPointer(event)
    if (isSlotOccupied(shiftsRef.current, memberId, selectedDate, slot)) {
      setHoveredSlot(null)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    createInitialShiftsRef.current = shiftsRef.current
    setHoveredSlot({ memberId, slot })
    setCreatingShift({ memberId, startSlot: slot, currentSlot: slot, adjustedShiftIds: [] })
  }

  const moveCreateShift = (memberId: string, event: PointerEvent<HTMLButtonElement>) => {
    if (!isAdmin || !creatingShift || creatingShift.memberId !== memberId) return
    const slot = getSlotFromPointer(event)
    const { start, end } = getCreateShiftTimeRange(creatingShift.startSlot, slot)
    const baseShifts = createInitialShiftsRef.current ?? shiftsRef.current
    const conflictResolution = adjustConflictingShiftRanges(
      baseShifts,
      memberId,
      selectedDate,
      start,
      end,
    )
    if (!conflictResolution) {
      setHoveredSlot(null)
      return
    }
    setShiftsWithoutHistory(conflictResolution.shifts)
    setHoveredSlot({ memberId, slot })
    setCreatingShift({
      ...creatingShift,
      currentSlot: slot,
      adjustedShiftIds: conflictResolution.adjustedShiftIds,
    })
  }

  const finishCreateShift = (memberId: string) => {
    if (!creatingShift || creatingShift.memberId !== memberId) return
    const { start, end } = getCreateShiftTimeRange(
      creatingShift.startSlot,
      creatingShift.currentSlot,
    )
    const baseShifts = createInitialShiftsRef.current
    setDraftBaseShifts(baseShifts)
    if (baseShifts) {
      setShiftsWithoutHistory(baseShifts)
    }
    createInitialShiftsRef.current = null
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
    if (createInitialShiftsRef.current) {
      setShiftsWithoutHistory(createInitialShiftsRef.current)
    }
    createInitialShiftsRef.current = null
    setCreatingShift(null)
    setHoveredSlot(null)
  }

  const getCreatePreview = (memberId: string) => {
    if (!creatingShift || creatingShift.memberId !== memberId) return null
    const startSlot = Math.min(creatingShift.startSlot, creatingShift.currentSlot)
    const endSlot = Math.max(creatingShift.startSlot, creatingShift.currentSlot) + 1
    const { start, end } = getCreateShiftTimeRange(
      creatingShift.startSlot,
      creatingShift.currentSlot,
    )
    return {
      left: TIMELINE_PADDING_WIDTH + startSlot * SLOT_WIDTH,
      width: Math.max((endSlot - startSlot) * SLOT_WIDTH, SLOT_WIDTH),
      start,
      end,
      adjustsConflictingShifts: creatingShift.adjustedShiftIds.length > 0,
    }
  }

  const getMobileCreatePreview = (memberId: string) => {
    if (!creatingShift || creatingShift.memberId !== memberId) return null
    const startSlot = Math.min(creatingShift.startSlot, creatingShift.currentSlot)
    const endSlot = Math.max(creatingShift.startSlot, creatingShift.currentSlot) + 1
    const { start, end } = getCreateShiftTimeRange(
      creatingShift.startSlot,
      creatingShift.currentSlot,
    )
    return {
      top: MOBILE_TIMELINE_PADDING_HEIGHT + startSlot * MOBILE_SLOT_HEIGHT,
      height: Math.max((endSlot - startSlot) * MOBILE_SLOT_HEIGHT, MOBILE_SLOT_HEIGHT),
      startSlot,
      endSlot,
      start,
      end,
      adjustsConflictingShifts: creatingShift.adjustedShiftIds.length > 0,
    }
  }

  const openAssignmentDraft = (templateId: ShiftTemplateId, start = 10 * 60) => {
    const template = allShiftTemplates[templateId]
    const end = clampShiftEnd(Math.min(start + template.defaultMinutes, END_MINUTES), start)
    const availableMember =
      scheduledMembers.find((member) =>
        !selectedDateShifts.some(
          (shift) =>
            shift.memberId === member.id &&
            shift.start < end &&
            shift.end > start,
        ),
      ) ?? scheduledMembers[0]
    if (!availableMember) return
    setDraftBaseShifts(null)
    setDraftShift({
      memberId: availableMember.id,
      date: selectedDate,
      start,
      end,
      templateId,
      note: template.note,
    })
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
    const baseShifts = draftBaseShifts ?? shiftsRef.current
    const conflictResolution = adjustConflictingShiftRanges(
      baseShifts,
      draftShift.memberId,
      draftShift.date,
      draftShift.start,
      draftShift.end,
    )
    if (!conflictResolution) return
    historyRef.current = {
      past: [...historyRef.current.past, baseShifts].slice(-100),
      future: [],
    }
    setShiftsWithoutHistory([...conflictResolution.shifts, shift])
    setDraftShift(null)
    setDraftBaseShifts(null)
  }

  const closeDraftShift = () => {
    setDraftShift(null)
    setDraftBaseShifts(null)
  }

  const createShiftTemplate = () => {
    const label = templateDraft.label.trim()
    if (!label) return
    const id = `custom-${crypto.randomUUID()}`
    const template = {
      label,
      kind: templateDraft.kind,
      defaultMinutes: templateDraft.defaultMinutes,
      note: templateDraft.note.trim() || label,
    }
    setCustomShiftTemplates((prev) => ({
      ...prev,
      [id]: template,
    }))
    setDraftShift((prev) =>
      prev
        ? {
          ...prev,
          templateId: id,
          end: clampShiftEnd(prev.start + template.defaultMinutes, prev.start),
          note: template.note,
        }
        : prev,
    )
    setTemplateDraft({ label: "", kind: "day", defaultMinutes: 60, note: "" })
  }

  const activateMove = (
    shift: Shift,
    element: HTMLDivElement,
    pointerId: number,
    clientX: number,
    clientY: number,
  ) => {
    if (!isAdmin || !element.isConnected) return
    try {
      element.setPointerCapture(pointerId)
    } catch {
      return
    }
    const rect = element.getBoundingClientRect()
    moveInitialShiftsRef.current = shiftsRef.current
    didMoveShiftRef.current = false
    setMoving({
      id: shift.id,
      originX: clientX,
      pointerOffsetX: clientX - rect.left,
      pointerX: clientX,
      pointerY: clientY,
      start: shift.start,
      end: shift.end,
      previewMemberId: shift.memberId,
      canDrop: true,
    })
  }

  const startMovePress = (shift: Shift, event: PointerEvent<HTMLDivElement>) => {
    if (!isAdmin || event.button !== 0) return
    const previousPending = pendingMovePressRef.current
    if (previousPending) window.clearTimeout(previousPending.timerId)
    const pending: PendingMovePress = {
      timerId: 0,
      shift,
      element: event.currentTarget,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    }
    pending.timerId = window.setTimeout(() => {
      if (pendingMovePressRef.current !== pending) return
      pendingMovePressRef.current = null
      activateMove(
        pending.shift,
        pending.element,
        pending.pointerId,
        pending.clientX,
        pending.clientY,
      )
    }, MOVE_LONG_PRESS_MS)
    pendingMovePressRef.current = pending
  }

  const updateMovePress = (event: PointerEvent<HTMLDivElement>) => {
    const pending = pendingMovePressRef.current
    if (!pending || pending.pointerId !== event.pointerId) return
    pending.clientX = event.clientX
    pending.clientY = event.clientY
  }

  const cancelMovePress = () => {
    const pending = pendingMovePressRef.current
    if (!pending) return
    window.clearTimeout(pending.timerId)
    pendingMovePressRef.current = null
  }

  const moveShift = (event: PointerEvent<HTMLDivElement>) => {
    if (!moving) return
    const baseShifts = moveInitialShiftsRef.current ?? shiftsRef.current
    const shift = baseShifts.find((item) => item.id === moving.id)
    if (!shift) return
    const candidateMemberId = getMemberIdFromPointer(event) ?? moving.previewMemberId
    const deltaSlots = Math.round((event.clientX - moving.originX) / SLOT_WIDTH)
    if (deltaSlots !== 0) {
      didMoveShiftRef.current = true
    }
    const duration = moving.end - moving.start
    const start = Math.min(
      Math.max(moving.start + deltaSlots * SLOT_MINUTES, START_MINUTES),
      END_MINUTES - duration,
    )
    const end = start + duration
    const canDrop = canPlaceShift(
      baseShifts,
      candidateMemberId,
      shift.date,
      start,
      end,
      moving.id,
    )
    setShiftsWithoutHistory(
      canDrop
        ? baseShifts.map((item) =>
          item.id === moving.id ? { ...item, start, end } : item,
        )
        : baseShifts,
    )
    setMoving((prev) =>
      prev
        ? {
          ...prev,
          pointerX: event.clientX,
          pointerY: event.clientY,
          previewMemberId: candidateMemberId,
          canDrop,
        }
        : prev,
    )
  }

  const stopMove = () => {
    if (moving) {
      if (!moving.canDrop) {
        if (moveInitialShiftsRef.current) {
          setShiftsWithoutHistory(moveInitialShiftsRef.current)
        }
        moveInitialShiftsRef.current = null
        didMoveShiftRef.current = true
        setMoving(null)
        return
      }
      const shift = shiftsRef.current.find((item) => item.id === moving.id)
      const memberId = moving.previewMemberId
      if (shift && memberId && memberId !== shift.memberId) {
        didMoveShiftRef.current = true
        setShiftsWithoutHistory(
          shiftsRef.current.map((item) =>
            item.id === moving.id ? { ...item, memberId } : item,
          ),
        )
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
    setResizing({
      id: shift.id,
      edge,
      originX: event.clientX,
      start: shift.start,
      end: shift.end,
      adjustedShiftIds: [],
    })
  }

  const moveResize = (event: PointerEvent<HTMLElement>) => {
    if (!resizing) return
    const baseShifts = resizeInitialShiftsRef.current ?? shiftsRef.current
    const shift = baseShifts.find((item) => item.id === resizing.id)
    if (!shift) return
    const deltaSlots = Math.round((event.clientX - resizing.originX) / SLOT_WIDTH)
    if (deltaSlots !== 0) {
      didResizeShiftRef.current = true
    }
    const deltaMinutes = deltaSlots * SLOT_MINUTES
    const desiredRange =
      resizing.edge === "start"
        ? {
          start: Math.min(
            Math.max(resizing.start + deltaMinutes, START_MINUTES),
            resizing.end - SLOT_MINUTES,
          ),
          end: resizing.end,
        }
        : {
          start: resizing.start,
          end: Math.max(
            Math.min(resizing.end + deltaMinutes, END_MINUTES),
            resizing.start + SLOT_MINUTES,
          ),
        }
    const conflictResolution = adjustConflictingShiftRanges(
      baseShifts,
      shift.memberId,
      shift.date,
      desiredRange.start,
      desiredRange.end,
      resizing.id,
    )
    if (conflictResolution) {
      setShiftsWithoutHistory(
        conflictResolution.shifts.map((item) =>
          item.id === resizing.id ? { ...item, ...desiredRange } : item,
        ),
      )
      setResizing((current) =>
        current
          ? { ...current, adjustedShiftIds: conflictResolution.adjustedShiftIds }
          : current,
      )
      return
    }
    setShiftsWithoutHistory(baseShifts)
    setResizing((current) => current ? { ...current, adjustedShiftIds: [] } : current)
  }

  const stopResize = () => {
    const baseShifts = resizeInitialShiftsRef.current
    if (baseShifts && resizing) {
      const nextShifts = shiftsRef.current
      const affectedOtherShifts = getShiftAdjustmentChanges(baseShifts, nextShifts, resizing.id)
      if (affectedOtherShifts.length > 0) {
        setShiftsWithoutHistory(baseShifts)
        setPendingShiftAdjustment({
          baseShifts,
          nextShifts,
          changes: getShiftAdjustmentChanges(baseShifts, nextShifts),
        })
      } else {
        commitShiftPreview(baseShifts)
      }
    }
    resizeInitialShiftsRef.current = null
    setResizing(null)
  }

  const confirmShiftAdjustment = () => {
    if (!pendingShiftAdjustment) return
    historyRef.current = {
      past: [...historyRef.current.past, pendingShiftAdjustment.baseShifts].slice(-100),
      future: [],
    }
    setShiftsWithoutHistory(pendingShiftAdjustment.nextShifts)
    setPendingShiftAdjustment(null)
  }

  const cancelShiftAdjustment = () => {
    setPendingShiftAdjustment(null)
  }

  const cancelResize = () => {
    if (resizeInitialShiftsRef.current) {
      setShiftsWithoutHistory(resizeInitialShiftsRef.current)
    }
    resizeInitialShiftsRef.current = null
    didResizeShiftRef.current = false
    setResizing(null)
  }

  const startCopyShift = (shift: Shift, event: PointerEvent<HTMLSpanElement>) => {
    if (!isAdmin) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const sourceElement = event.currentTarget.parentElement?.querySelector<HTMLElement>("[data-shift-block]")
    const sourceRect = (sourceElement ?? event.currentTarget).getBoundingClientRect()
    const copyRect = {
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
    }
    setCopying({
      sourceId: shift.id,
      previewMemberId: shift.memberId,
      canDrop: false,
      sourceRect: copyRect,
      stretchRect: copyRect,
    })
  }

  const moveCopyShift = (event: PointerEvent<HTMLSpanElement>) => {
    if (!copying) return
    const sourceShift = shiftsRef.current.find((shift) => shift.id === copying.sourceId)
    if (!sourceShift) return
    const exactCandidateRow = getMemberRowFromPointer(event)
    const candidateRow = exactCandidateRow ?? getNearestMemberRowFromPointer(event)
    const candidateMemberId = candidateRow?.dataset.shiftMemberId ?? copying.previewMemberId
    const canDrop = canCopyShiftToMember(shiftsRef.current, sourceShift, candidateMemberId)
    const sourceTop = copying.sourceRect.top
    const sourceHeight = copying.sourceRect.height
    const targetTop = candidateRow ? event.clientY - sourceHeight / 2 : sourceTop
    setCopying((current) =>
      current
        ? {
          ...current,
          previewMemberId: candidateMemberId,
          canDrop,
          stretchRect: {
            ...current.stretchRect,
            top: Math.min(sourceTop, targetTop),
            height: Math.abs(targetTop - sourceTop) + sourceHeight,
          },
        }
        : current,
    )
  }

  const stopCopyShift = () => {
    if (!copying) return
    const sourceShift = shiftsRef.current.find((shift) => shift.id === copying.sourceId)
    if (sourceShift && copying.canDrop && copying.previewMemberId !== sourceShift.memberId) {
      const copiedShift = copyShiftForMember(
        sourceShift,
        copying.previewMemberId,
        `shift-${crypto.randomUUID()}`,
      )
      recordShiftsChange((current) => [...current, copiedShift])
    }
    setCopying(null)
  }

  const cancelCopyShift = () => {
    setCopying(null)
  }

  const closeShiftDetail = () => {
    setSelectedShiftId(null)
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
    closeShiftDetail()
  }

  const toggleMemberPin = (memberId: string) => {
    setPinnedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    )
  }

  const toggleFilters = (anchor: FilterAnchor, event: ReactMouseEvent<HTMLButtonElement>) => {
    if (filtersOpen && filterAnchor === anchor) {
      setFiltersOpen(false)
      setFilterAnchor(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.max(8, rect.left)
    filterTriggerRef.current = event.currentTarget
    setFilterAnchor(anchor)
    setFilterPanelPosition({
      left,
      top: rect.top,
      width: Math.max(280, Math.min(560, window.innerWidth - left - 16)),
      maxHeight: Math.max(240, window.innerHeight - rect.top - 16),
    })
    setFiltersOpen(true)
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

  useEffect(() => {
    if (!filtersOpen) return

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (target instanceof Element && target.closest("[data-shift-filter-picker-popup]")) return
      if (filterPanelRef.current?.contains(target) || filterTriggerRef.current?.contains(target)) return
      setFiltersOpen(false)
      setFilterAnchor(null)
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return
      setFiltersOpen(false)
      setFilterAnchor(null)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [filtersOpen])

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <CalendarDays className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">シフト管理</h1>
        {shiftSchedule ? (
          <>
            <div className="flex rounded-md border bg-muted/35 p-0.5">
              <Button
                type="button"
                size="sm"
                variant={shiftViewMode === "member" ? "secondary" : "ghost"}
                className="h-7 px-2.5"
                onClick={() => setShiftViewMode("member")}
              >
                <Users className="size-3.5" />
                個人別
              </Button>
              <Button
                type="button"
                size="sm"
                variant={shiftViewMode === "assignment" ? "secondary" : "ghost"}
                className="h-7 px-2.5"
                onClick={() => setShiftViewMode("assignment")}
              >
                <Layers3 className="size-3.5" />
                担当業務別
              </Button>
            </div>
            <Select value={selectedDate} onValueChange={(value) => value !== null && setSelectedDate(value)}>
              <SelectTrigger className="h-8 w-auto max-w-full bg-background">
                <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  <span>{formatCompactDate(selectedDate)}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="w-max min-w-80">
                {dateTabs.map((date) => (
                  <SelectItem
                    key={date}
                    value={date}
                    hideIndicator
                    className="pr-2 pl-2"
                  >
                    <span className="grid size-4 shrink-0 place-items-center">
                      {date === selectedDate ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className={date === selectedDate ? "font-semibold" : ""}>
                      {formatCompactDate(date)}
                    </span>
                    <span
                      className={`ml-auto pl-5 text-xs font-normal ${
                        date === selectedDate ? "" : "text-muted-foreground!"
                      }`}
                    >
                      {getOperationPeriodLabel(date)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={exportShifts}
              disabled={exportableShifts.length === 0}
              title="表示中の日付と絞り込み条件でCSV出力"
            >
              <Download className="size-4" />
              CSV
            </Button>
          </>
        ) : null}
      </header>

      {!shiftSchedule ? (
        <section className="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card p-8 text-center">
          <div>
            <h2 className="font-semibold">シフトデータがありません</h2>
            <p className="mt-2 text-sm text-muted-foreground">運営期間とメンバーの設定を確認してください。</p>
          </div>
        </section>
      ) : (
        <>
          {shiftViewMode === "assignment" ? (
            <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card p-3 md:p-4">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-semibold">担当業務別の配置</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    色の数字は同じ時間帯に入っている人数です。時間帯または割り当てをクリックして編集できます。
                  </p>
                </div>
                <Badge variant="outline">{assignmentCoverage.length}業務</Badge>
              </div>
              <div className="grid gap-4">
                {assignmentCoverage.map((group) => (
                  <section key={`coverage-${group.templateId}`} className="rounded-xl border bg-background p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div
                        className="mt-1 size-3 shrink-0 rounded-full"
                        style={getShiftTemplateColor(group.templateId).dotStyle}
                      />
                      <div>
                        <h3 className="font-semibold">{group.template.label}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {group.memberCount}名・延べ
                          {(group.totalMinutes / 60).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}時間・
                          最大{group.maxOverlap}名重複
                        </p>
                      </div>
                      {SHIFT_CREATION_ENABLED ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="ml-auto"
                          onClick={() => openAssignmentDraft(group.templateId)}
                        >
                          <Plus className="size-3.5" />
                          割り当て追加
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <div className="min-w-180">
                        <div
                          className="grid gap-0.5"
                          style={{ gridTemplateColumns: `repeat(${coverageTimeSlots.length}, minmax(20px, 1fr))` }}
                        >
                          {group.slotCounts.map((count, index) => {
                            const start = coverageTimeSlots[index]
                            const overlapClass =
                              count === 0
                                ? "bg-muted/25 text-muted-foreground/45"
                                : count === 1
                                  ? "bg-sky-500/15 text-sky-800"
                                  : count <= 3
                                    ? "bg-amber-500/25 text-amber-900"
                                    : "bg-rose-500/30 text-rose-900"
                            return (
                              <button
                                key={`${group.templateId}-${start}`}
                                type="button"
                                disabled={!SHIFT_CREATION_ENABLED}
                                className={`h-9 rounded-sm text-[11px] font-semibold transition enabled:hover:ring-2 enabled:hover:ring-ring/40 ${overlapClass}`}
                                title={`${formatTime(start)}〜${formatTime(start + COVERAGE_SLOT_MINUTES)}: ${count}名`}
                                onClick={() => openAssignmentDraft(group.templateId, start)}
                              >
                                {count}
                              </button>
                            )
                          })}
                        </div>
                        <div
                          className="mt-1 grid gap-0.5 text-[10px] text-muted-foreground"
                          style={{ gridTemplateColumns: `repeat(${coverageTimeSlots.length}, minmax(20px, 1fr))` }}
                        >
                          {coverageTimeSlots.map((start, index) => (
                            <span key={`coverage-time-${start}`} className="truncate">
                              {index % 4 === 0 ? formatTime(start) : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex max-h-40 flex-wrap gap-2 overflow-auto">
                      {group.assignments.map((shift) => (
                        <button
                          key={`coverage-assignment-${shift.id}`}
                          type="button"
                          className="rounded-lg border px-2.5 py-2 text-left text-xs transition hover:ring-2 hover:ring-ring/30"
                          style={getShiftTemplateColor(shift.templateId).blockStyle}
                          onClick={() => openShiftDetail(shift.id)}
                        >
                          <span className="font-semibold">{memberName(shift.memberId)}</span>
                          <span className="ml-2 opacity-75">
                            {formatTime(shift.start)}〜{formatTime(shift.end)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          <div className={`${shiftViewMode === "member" ? "space-y-3 md:hidden" : "hidden"} min-h-0 flex-1 overflow-auto select-none`}>
            <Button
              type="button"
              variant="outline"
              className="w-full min-w-0 justify-start"
              onClick={(event) => toggleFilters("mobile", event)}
              title={filterSummary || "絞り込み"}
              aria-expanded={filtersOpen && filterAnchor === "mobile"}
            >
              <ListFilter className="size-4" />
              <span className="shrink-0">絞り込み</span>
              {filterSummary ? (
                <span className="min-w-0 truncate border-l pl-2 text-xs font-normal text-muted-foreground">
                  {filterSummary}
                </span>
              ) : null}
            </Button>
            {visiblePinnedMembers.length > 0 ? (
              <div className="sticky top-0 z-30 rounded-lg border bg-card/95 p-2 shadow-sm backdrop-blur">
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">ピン留め</div>
                <div className="flex flex-wrap gap-1.5">
                  {visiblePinnedMembers.map((member) => (
                    <Button
                      key={`mobile-pinned-${member.id}`}
                      type="button"
                      size="xs"
                      variant="secondary"
                      aria-label={`${member.name}のピン留めを解除`}
                      onClick={() => toggleMemberPin(member.id)}
                    >
                      <Pin className="size-3 fill-current" />
                      {member.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {hasNoFilterResults ? (
              <ShiftFilterEmptyState className="rounded-lg border bg-card" />
            ) : null}
            {visibleInvitedMembers.map((member) => {
              const isPinned = visiblePinnedMemberIdSet.has(member.id)
              const hoveredMemberSlot = hoveredSlot?.memberId === member.id ? hoveredSlot.slot : null
              const memberShifts = (isPinned ? selectedDateShifts : visibleSelectedDateShifts)
                .filter((shift) => shift.memberId === member.id)
                .sort((left, right) => left.start - right.start)
              const allMemberShifts = selectedDateShifts.filter((shift) => shift.memberId === member.id)
              const createPreview = getMobileCreatePreview(member.id)
              return (
                <section key={`mobile-member-${member.id}`} className="rounded-lg border bg-card p-3">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium">{member.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={`font-normal ${memberDepartmentBadgeClass(member.department)}`}
                        >
                          {member.department}
                        </Badge>
                        <MemberRoleBadges value={member.role} />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant={isPinned ? "secondary" : "ghost"}
                      aria-label={isPinned ? `${member.name}のピン留めを解除` : `${member.name}をピン留め`}
                      aria-pressed={isPinned}
                      onClick={() => toggleMemberPin(member.id)}
                    >
                      <Pin className={`size-4 ${isPinned ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <div className="relative" style={{ height: MOBILE_TIMELINE_TRACK_HEIGHT }}>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-14 right-0 rounded-lg"
                      style={{
                        backgroundImage: MOBILE_TIMELINE_GRID_BACKGROUND,
                      }}
                    />
                    {timeOptions
                      .filter((slot) => (slot.minutes - START_MINUTES) % 120 === 0)
                      .map((slot) => {
                        const slotIndex = (slot.minutes - START_MINUTES) / SLOT_MINUTES
                        return (
                          <div
                            key={`mobile-time-${member.id}-${slot.value}`}
                            className="absolute left-0 right-0 border-t border-dashed border-border/70"
                            style={{ top: MOBILE_TIMELINE_PADDING_HEIGHT + slotIndex * MOBILE_SLOT_HEIGHT }}
                          >
                            <span className="-mt-2.5 inline-block w-12 bg-card pr-2 text-xs text-muted-foreground">
                              {slot.label}
                            </span>
                          </div>
                        )
                      })}
                    <button
                      type="button"
                      disabled={!SHIFT_DND_CREATION_ENABLED || !isAdmin}
                      data-shift-member-id={member.id}
                      onPointerDown={(event) => beginCreateMobileShift(member.id, event)}
                      onPointerMove={(event) => moveCreateMobileShift(member.id, event)}
                      onPointerUp={() => finishCreateShift(member.id)}
                      onPointerCancel={cancelCreateShift}
                      onPointerLeave={() => {
                        if (!creatingShift || creatingShift.memberId !== member.id) {
                          setHoveredSlot(null)
                        }
                      }}
                      className="absolute left-14 right-0 rounded-lg border border-dashed border-border/80 text-left transition enabled:cursor-copy enabled:hover:bg-muted/30 disabled:cursor-default"
                      style={{
                        top: MOBILE_TIMELINE_PADDING_HEIGHT,
                        height: MOBILE_TIMELINE_HEIGHT,
                      }}
                      aria-label={`${member.name}のシフトを追加`}
                    >
                      {allMemberShifts.map((shift) => {
                        const blockedTop = ((shift.start - START_MINUTES) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
                        const blockedHeight = ((shift.end - shift.start) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
                        return (
                          <span
                            key={`mobile-blocked-slot-${shift.id}`}
                            className="absolute inset-x-0 cursor-not-allowed"
                            style={{ top: blockedTop, height: blockedHeight }}
                            onPointerDown={(event) => event.stopPropagation()}
                            onPointerEnter={() => setHoveredSlot(null)}
                            onPointerMove={(event) => event.stopPropagation()}
                            onPointerUp={(event) => event.stopPropagation()}
                            aria-hidden="true"
                          />
                        )
                      })}
                      {hoveredMemberSlot !== null ? (
                        <span
                          className="pointer-events-none absolute inset-x-0 border-b bg-muted"
                          style={{
                            top: hoveredMemberSlot * MOBILE_SLOT_HEIGHT,
                            height: MOBILE_SLOT_HEIGHT,
                            borderBottomColor: "color-mix(in oklch, var(--border), transparent 35%)",
                          }}
                        />
                      ) : null}
                    </button>
                    <div className="absolute inset-y-0 left-14 border-l border-border" />
                    {memberShifts.length === 0 ? (
                      <div className="pointer-events-none absolute left-16 right-0 top-11 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        この日のシフトはありません
                      </div>
                    ) : null}
                    {createPreview ? (
                      <div
                        className="pointer-events-none absolute left-16 right-1 z-50 box-border overflow-visible rounded-md border px-2 py-1 text-left shadow-sm"
                        style={{
                          top: createPreview.top,
                          height: Math.max(createPreview.height, 44),
                          ...getShiftTemplateColor(DEFAULT_SHIFT_TEMPLATE_ID).blockStyle,
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <ShiftCreateTimeLabel
                            start={createPreview.start}
                            end={createPreview.end}
                            orientation="horizontal"
                          />
                          <span className="truncate text-xs opacity-80">
                            {allShiftTemplates[DEFAULT_SHIFT_TEMPLATE_ID].label}
                          </span>
                        </div>
                        {createPreview.adjustsConflictingShifts ? (
                          <span className="absolute left-0 top-full mt-2 w-64 rounded-md border border-amber-500/40 bg-background px-2 py-1.5 text-xs text-amber-700 shadow-sm">
                            他のシフトの時間帯が変更される可能性があります。
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {memberShifts.map((shift) => {
                      const top = MOBILE_TIMELINE_PADDING_HEIGHT + ((shift.start - START_MINUTES) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
                      const height = Math.max(((shift.end - shift.start) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT, 44)
                      const template = allShiftTemplates[shift.templateId]
                      return (
                        <button
                          key={`mobile-shift-${shift.id}`}
                          type="button"
                          onClick={() => openShiftDetail(shift.id)}
                          className="absolute left-16 right-0 rounded-md border px-3 py-2 text-left shadow-sm"
                          style={{ top, height, ...getShiftTemplateColor(shift.templateId).blockStyle }}
                        >
                          <span className="block text-sm font-medium">
                            {formatTime(shift.start)}-{formatTime(shift.end)}
                          </span>
                          <span className="mt-0.5 block truncate text-xs opacity-80">
                            {shift.note || template.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>

          <div className={`${shiftViewMode === "member" ? "hidden md:block" : "hidden"} min-h-0 flex-1 select-none overflow-auto rounded-lg border bg-card`}>
            <div className="grid min-w-300 grid-cols-[15rem_1fr]">
              <div className="sticky left-0 top-0 z-30 flex h-16 items-center border-b border-r bg-card px-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full min-w-0 justify-start"
                  onClick={(event) => toggleFilters("table", event)}
                  title={filterSummary || "絞り込み"}
                  aria-expanded={filtersOpen && filterAnchor === "table"}
                >
                  <ListFilter className="size-4" />
                  <span className="shrink-0">絞り込み</span>
                  {filterSummary ? (
                    <span className="min-w-0 truncate border-l pl-2 text-xs font-normal text-muted-foreground">
                      {filterSummary}
                    </span>
                  ) : null}
                </Button>
              </div>
              <div className="sticky top-0 z-20 flex h-16 items-center border-b bg-card">
                <div className="relative h-full" style={{ width: TIMELINE_TRACK_WIDTH }}>
                  {timeOptions.map((slot, index) => {
                    const isMajor = (slot.minutes - START_MINUTES) % 120 === 0
                    const isHovered =
                      creatingShift === null
                      && moving === null
                      && resizing === null
                      && hoveredSlot?.slot === index
                    return (
                      <span
                        key={`time-slot-${slot.value}`}
                        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs transition ${isHovered
                            ? "font-semibold text-foreground opacity-100"
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

              {visibleInvitedMembers.map((member) => {
                const isPinned = visiblePinnedMemberIdSet.has(member.id)
                const pinnedIndex = visiblePinnedMemberIds.indexOf(member.id)
                const pinnedTop = DESKTOP_TIMELINE_HEADER_HEIGHT + pinnedIndex * DESKTOP_MEMBER_ROW_HEIGHT
                const hoveredMemberSlot = hoveredSlot?.memberId === member.id ? hoveredSlot.slot : null
                const movingPreviewShift = moving
                  ? selectedDateShifts.find((shift) => shift.id === moving.id) ?? null
                  : null
                const memberShifts = (isPinned ? selectedDateShifts : visibleSelectedDateShifts)
                  .filter((shift) => shift.memberId === member.id)
                const allMemberShifts = selectedDateShifts.filter((shift) => shift.memberId === member.id)
                const movingMemberShifts =
                  movingPreviewShift && moving?.previewMemberId === member.id && movingPreviewShift.memberId !== member.id
                    ? [...memberShifts, { ...movingPreviewShift, memberId: member.id }]
                    : memberShifts
                const visibleMemberShifts =
                  copyingShift && copying?.previewMemberId === member.id && copyingShift.memberId !== member.id
                    ? [...movingMemberShifts, { ...copyingShift, memberId: member.id }]
                    : movingMemberShifts
                const createPreview = getCreatePreview(member.id)
                return (
                  <div key={`member-row-${member.id}`} className="contents">
                    <div
                      className={`sticky left-0 border-r border-b bg-card p-4 ${isPinned ? "z-25 h-[88px] shadow-sm" : "z-10"}`}
                      style={isPinned ? { top: pinnedTop } : undefined}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 font-medium">{member.name}</div>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant={isPinned ? "secondary" : "ghost"}
                          aria-label={isPinned ? `${member.name}のピン留めを解除` : `${member.name}をピン留め`}
                          aria-pressed={isPinned}
                          onClick={() => toggleMemberPin(member.id)}
                        >
                          <Pin className={`size-4 ${isPinned ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={`font-normal ${memberDepartmentBadgeClass(member.department)}`}
                        >
                          {member.department}
                        </Badge>
                        <MemberRoleBadges value={member.role} />
                      </div>
                    </div>
                    <div
                      className={`border-b py-3 ${isPinned ? "sticky z-15 h-[88px] bg-card shadow-sm" : ""}`}
                      style={isPinned ? { top: pinnedTop } : undefined}
                    >
                      <div className="relative h-16" style={{ width: TIMELINE_TRACK_WIDTH }}>
                        <button
                          type="button"
                          disabled={!SHIFT_DND_CREATION_ENABLED || !isAdmin}
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
                          {allMemberShifts.map((shift) => {
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
                          {hoveredMemberSlot !== null ? (
                            <span
                              className={`pointer-events-none absolute inset-y-0 border-r bg-muted ${getHoveredSlotRadiusClass(hoveredMemberSlot)}`}
                              style={{
                                left: hoveredMemberSlot * SLOT_WIDTH,
                                width: SLOT_WIDTH,
                                borderRightColor: "color-mix(in oklch, var(--border), transparent 35%)",
                              }}
                            />
                          ) : null}
                        </button>
                        {createPreview ? (
                          <div
                            className={`pointer-events-none absolute top-2 z-50 box-border h-12 overflow-visible rounded-md border text-left ${createPreview.width === SLOT_WIDTH ? "px-0" : "px-3 shadow-sm"}`}
                            style={{
                              left: createPreview.left,
                              width: createPreview.width,
                              minWidth: createPreview.width,
                              maxWidth: createPreview.width,
                              ...getShiftTemplateColor(DEFAULT_SHIFT_TEMPLATE_ID).blockStyle,
                            }}
                          >
                            {shouldSplitShiftTimeLabels(createPreview.start, createPreview.end) ? (
                              <>
                                <span className="absolute -top-3 right-full mr-2 whitespace-nowrap text-sm font-medium">
                                  {formatTime(createPreview.start)}
                                </span>
                                <span className="absolute -top-3 left-full ml-2 whitespace-nowrap text-sm font-medium">
                                  {formatTime(createPreview.end)}
                                </span>
                              </>
                            ) : (
                              <div className="absolute left-1 top-1 z-10">
                                <ShiftCreateTimeLabel
                                  start={createPreview.start}
                                  end={createPreview.end}
                                  orientation="horizontal"
                                />
                              </div>
                            )}
                            {createPreview.width > SLOT_WIDTH ? (
                              <span className="absolute left-1 top-7 block truncate text-xs opacity-80">
                                {allShiftTemplates[DEFAULT_SHIFT_TEMPLATE_ID].label}
                              </span>
                            ) : null}
                            {createPreview.adjustsConflictingShifts ? (
                              <span className="absolute left-0 top-full mt-2 w-72 rounded-md border border-amber-500/40 bg-background px-2 py-1.5 text-xs text-amber-700 shadow-sm">
                                他のシフトの時間帯が変更される可能性があります。
                              </span>
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
                          const isResizingShift = resizing?.id === shift.id
                          const isEditingShift = isMovingShift || isResizingShift
                          const hasSplitEditingTimes =
                            isEditingShift && shouldSplitShiftTimeLabels(shift.start, shift.end)
                          const adjustsConflictingShifts =
                            isResizingShift && resizing.adjustedShiftIds.length > 0
                          const isMovingAlias = isMovingShift && movingPreviewShift?.memberId !== shift.memberId
                          const isMovingSource = isMovingShift && !isMovingAlias
                          const isMovingSourceAlias = isMovingSource && moving?.previewMemberId === shift.memberId
                          const isHiddenMovingSource = isMovingSource && !isMovingSourceAlias
                          const isCopyingAlias =
                            copying?.sourceId === shift.id
                            && copying.previewMemberId === member.id
                            && copyingShift?.memberId !== member.id
                          const isCopyingSource = copying?.sourceId === shift.id && !isCopyingAlias
                          const isInteractionAlias = isMovingAlias || isCopyingAlias
                          const verticalHandleLength = Math.min(40, visualWidth)
                          return (
                            <div key={`${shift.id}-${isCopyingAlias ? "copy" : "shift"}`} className="group contents">
                              <div
                                data-shift-block
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (!isInteractionAlias) openShiftDetail(shift.id)
                                }}
                                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    openShiftDetail(shift.id)
                                  }
                                }}
                                onPointerDown={(event) => {
                                  if (!isInteractionAlias) startMovePress(shift, event)
                                }}
                                onPointerMove={(event) => {
                                  updateMovePress(event)
                                  moveShift(event)
                                  moveResize(event)
                                }}
                                onPointerUp={() => {
                                  cancelMovePress()
                                  stopMove()
                                  stopResize()
                                }}
                                onPointerCancel={() => {
                                  cancelMovePress()
                                  cancelMove()
                                  cancelResize()
                                }}
                                aria-label={`${member.name} ${formatTime(shift.start)}-${formatTime(shift.end)}の詳細`}
                                className={`${isInteractionAlias ? "pointer-events-none" : "pointer-events-auto"} absolute top-2 box-border h-12 select-none rounded-md border text-left transition hover:z-30 hover:ring-2 hover:ring-inset hover:ring-ring/40 ${hasSplitEditingTimes || adjustsConflictingShifts ? "overflow-visible" : "overflow-hidden"} ${isHiddenMovingSource ? "opacity-0" : ""} ${isMovingAlias || isMovingSourceAlias || isCopyingAlias ? "opacity-40 ring-2 ring-inset ring-ring/30" : ""} ${isCopyingAlias && !copying?.canDrop ? "ring-destructive" : ""} ${isSingleSlotShift ? "px-0" : "px-3 shadow-sm"} ${isAdmin && !isInteractionAlias ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                                  }`}
                                style={{
                                  left,
                                  width: visualWidth,
                                  minWidth: visualWidth,
                                  maxWidth: visualWidth,
                                  ...getShiftTemplateColor(shift.templateId).blockStyle,
                                }}
                              >
                                {hasSplitEditingTimes ? (
                                  <>
                                    <span className="absolute -top-3 right-full mr-2 whitespace-nowrap text-sm font-medium">
                                      {formatTime(shift.start)}
                                    </span>
                                    <span className="absolute -top-3 left-full ml-2 whitespace-nowrap text-sm font-medium">
                                      {formatTime(shift.end)}
                                    </span>
                                  </>
                                ) : isSingleSlotShift ? null : (
                                  <>
                                    <span className="block select-none truncate text-sm font-medium">
                                      {formatTime(shift.start)}-{formatTime(shift.end)}
                                    </span>
                                    <span className="block select-none truncate text-xs opacity-80">{shift.note || template.label}</span>
                                  </>
                                )}
                                {adjustsConflictingShifts ? (
                                  <span className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border border-amber-500/40 bg-background px-2 py-1.5 text-xs text-amber-700 shadow-sm">
                                    他のシフトの時間帯が変更される可能性があります。
                                  </span>
                                ) : null}
                              </div>
                              {isAdmin && !isInteractionAlias ? (
                                <>
                                  <span
                                    className={`pointer-events-auto absolute top-3 z-40 h-10 w-2 cursor-w-resize rounded-l-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${isMovingShift || isCopyingSource ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}
                                    style={{
                                      left,
                                      cursor: "url('/cursors/resize-left.svg') 12 12, w-resize",
                                    }}
                                    onClick={(event) => event.stopPropagation()}
                                    onPointerDown={(event) => startResize(shift, "start", event)}
                                    onPointerMove={(event) => moveResize(event)}
                                    onPointerUp={stopResize}
                                    onPointerCancel={cancelResize}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className={`pointer-events-auto absolute top-3 z-40 h-10 w-2 cursor-e-resize rounded-r-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${isMovingShift || isCopyingSource ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}
                                    style={{
                                      left: left + visualWidth - 8,
                                      cursor: "url('/cursors/resize-right.svg') 12 12, e-resize",
                                    }}
                                    onClick={(event) => event.stopPropagation()}
                                    onPointerDown={(event) => startResize(shift, "end", event)}
                                    onPointerMove={(event) => moveResize(event)}
                                    onPointerUp={stopResize}
                                    onPointerCancel={cancelResize}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className={`pointer-events-auto absolute top-2 z-40 h-2 cursor-n-resize rounded-t-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${isMovingShift || isCopyingSource ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}
                                    style={{
                                      left: left + (visualWidth - verticalHandleLength) / 2,
                                      width: verticalHandleLength,
                                      cursor: "url('/cursors/resize-up.svg') 12 12, n-resize",
                                    }}
                                    onClick={(event) => event.stopPropagation()}
                                    onPointerDown={(event) => startCopyShift(shift, event)}
                                    onPointerMove={moveCopyShift}
                                    onPointerUp={stopCopyShift}
                                    onPointerCancel={cancelCopyShift}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className={`pointer-events-auto absolute top-12 z-40 h-2 cursor-s-resize rounded-b-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${isMovingShift || isCopyingSource ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}
                                    style={{
                                      left: left + (visualWidth - verticalHandleLength) / 2,
                                      width: verticalHandleLength,
                                      cursor: "url('/cursors/resize-down.svg') 12 12, s-resize",
                                    }}
                                    onClick={(event) => event.stopPropagation()}
                                    onPointerDown={(event) => startCopyShift(shift, event)}
                                    onPointerMove={moveCopyShift}
                                    onPointerUp={stopCopyShift}
                                    onPointerCancel={cancelCopyShift}
                                    aria-hidden="true"
                                  />
                                </>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {hasNoFilterResults ? (
              <ShiftFilterEmptyState className="sticky left-0 min-h-40 w-full border-b" />
            ) : null}
          </div>
        </>
      )}

      {moving && movingShift ? (
        <div
          className={`pointer-events-none fixed z-50 box-border h-12 select-none rounded-md border text-left opacity-90 shadow-lg ${shouldSplitShiftTimeLabels(movingShift.start, movingShift.end) ? "overflow-visible" : "overflow-hidden"} ${moving.canDrop ? "" : "ring-2 ring-destructive"} ${movingShift.end - movingShift.start === SLOT_MINUTES ? "px-0" : "px-3"}`}
          style={{
            left: moving.pointerX - moving.pointerOffsetX,
            top: moving.pointerY - 24,
            width: ((movingShift.end - movingShift.start) / SLOT_MINUTES) * SLOT_WIDTH + 1,
            ...getShiftTemplateColor(movingShift.templateId).blockStyle,
          }}
        >
          {!moving.canDrop ? (
            <span
              data-slot="invalid-shift-drop-indicator"
              className="absolute inset-0 z-10 grid place-items-center"
              aria-hidden="true"
            >
              <X className="size-5 text-destructive drop-shadow-sm" strokeWidth={3} />
            </span>
          ) : null}
          {shouldSplitShiftTimeLabels(movingShift.start, movingShift.end) ? (
            <>
              <span className="absolute -top-3 right-full mr-2 whitespace-nowrap text-sm font-medium">
                {formatTime(movingShift.start)}
              </span>
              <span className="absolute -top-3 left-full ml-2 whitespace-nowrap text-sm font-medium">
                {formatTime(movingShift.end)}
              </span>
            </>
          ) : movingShift.end - movingShift.start === SLOT_MINUTES ? null : (
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

      {copying && copyingShift
        ? createPortal(
          <div
            className={`pointer-events-none fixed z-50 rounded-md border opacity-75 shadow-lg ${copying.canDrop ? "" : "ring-2 ring-destructive"}`}
            style={{
              left: copying.stretchRect.left,
              top: copying.stretchRect.top,
              width: copying.stretchRect.width,
              height: copying.stretchRect.height,
              ...getShiftTemplateColor(copyingShift.templateId).blockStyle,
            }}
            aria-hidden="true"
          >
            {!copying.canDrop ? (
              <span className="absolute inset-0 grid place-items-center">
                <X className="size-6 text-destructive drop-shadow-sm" strokeWidth={3} />
              </span>
            ) : null}
          </div>,
          document.body,
        )
        : null}

      {filtersOpen && filterPanelPosition
        ? createPortal(
          <div
            ref={filterPanelRef}
            role="region"
            aria-label="シフト絞り込み"
            className="fixed z-50 overflow-y-auto rounded-lg border bg-popover p-5 text-popover-foreground shadow-lg"
            style={{
              left: filterPanelPosition.left,
              top: filterPanelPosition.top,
              width: filterPanelPosition.width,
              maxHeight: filterPanelPosition.maxHeight,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">シフト絞り込み</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  表示するメンバーとシフトを条件で絞り込みます。
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setFiltersOpen(false)
                  setFilterAnchor(null)
                }}
                aria-label="絞り込みカードを閉じる"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>担当業務</Label>
                <ShiftFilterPicker label="担当業務" value={shiftFilter} options={shiftFilterOptions} onChange={setShiftFilter} />
              </div>
              <div className="grid gap-1.5">
                <Label>メンバー名</Label>
                <ShiftFilterPicker label="メンバー名" value={memberSearch} options={members.map((member) => member.name)} onChange={setMemberSearch} />
              </div>
              <div className="grid gap-1.5">
                <Label>所属</Label>
                <ShiftFilterPicker label="所属" value={departmentFilter} allValue={ALL_DEPARTMENTS} options={departments} onChange={setDepartmentFilter} />
              </div>
              <div className="grid gap-1.5">
                <Label>役職</Label>
                <ShiftFilterPicker label="役職" value={roleFilter} allValue="すべての役職" options={roles} onChange={setRoleFilter} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShiftFilter("")
                  setMemberSearch("")
                  setDepartmentFilter(ALL_DEPARTMENTS)
                  setRoleFilter("すべての役職")
                }}
              >
                クリア
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setFiltersOpen(false)
                  setFilterAnchor(null)
                }}
              >
                適用
              </Button>
            </div>
          </div>,
          document.body,
        )
        : null}

      <ShiftCreationDialog
        draft={draftShift}
        templateDraft={templateDraft}
        members={scheduledMembers}
        templates={allShiftTemplates}
        adjustmentChanges={draftAdjustmentChanges}
        canCreate={draftConflictResolution !== null}
        setDraft={setDraftShift}
        setTemplateDraft={setTemplateDraft}
        onCreateTemplate={createShiftTemplate}
        onCreate={createDraftShift}
        onClose={closeDraftShift}
      />

      <ShiftAdjustmentDialog
        pending={pendingShiftAdjustment}
        templates={allShiftTemplates}
        onConfirm={confirmShiftAdjustment}
        onCancel={cancelShiftAdjustment}
      />

      <ShiftDetailsDialog
        open={selectedShiftId !== null}
        shift={selectedShift}
        members={scheduledMembers}
        templates={allShiftTemplates}
        editable={isAdmin}
        onUpdate={updateShift}
        onDelete={deleteSelectedShift}
        onClose={closeShiftDetail}
      />
    </div>
  )
}
