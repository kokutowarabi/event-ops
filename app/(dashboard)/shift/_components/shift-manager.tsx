import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { createPortal } from "react-dom"
import type { Member } from "@/lib/members"
import { downloadCsv } from "@/lib/csv"
import { operationPeriod } from "@/lib/event-schedule"
import { parseMemberRoles } from "@/lib/member-role"
import type {
  Shift,
  ShiftData,
  ShiftSchedule,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
import {
  ShiftAssignmentView,
  type AssignmentCoverageGroup,
} from "./shift-assignment-view"
import { useShiftCreationActions } from "./shift-creation-actions"
import { ShiftDesktopView } from "./shift-desktop-view"
import { ShiftDragOverlays } from "./shift-drag-overlays"
import { ShiftFilterPanel } from "./shift-filter-panel"
import { ShiftHeader } from "./shift-header"
import { ShiftMobileView } from "./shift-mobile-view"
import { useShiftCopyActions, useShiftMoveActions } from "./shift-move-actions"
import { useShiftResizeActions } from "./shift-resize-actions"
import {
  ShiftAdjustmentDialog,
  ShiftCreationDialog,
  ShiftDetailsDialog,
} from "./shift-dialogs"
import type { FilterPanelPosition } from "./shift-filter-ui"
import {
  addDays,
  adjustConflictingShiftRanges,
  clampShiftEnd,
  COVERAGE_SLOT_MINUTES,
  coverageTimeSlots,
  createShiftTemplateColor,
  dateDiff,
  DEFAULT_SHIFT_TEMPLATE_ID,
  END_MINUTES,
  formatTime,
  getShiftAdjustmentChanges,
  orderMemberIdsWithPins,
  shiftsEqual,
  shiftTemplates,
  type ShiftTemplateColor,
} from "./shift-domain"
import { SHIFT_CREATION_ENABLED } from "./shift-layout"
import type {
  CopyingShift,
  CreatingShift,
  DraftShift,
  DraftShiftTemplate,
  FilterAnchor,
  MovingShift,
  PendingMovePress,
  PendingShiftAdjustment,
  ResizingShift,
  ShiftViewMode,
} from "./shift-types"

export type { Shift, ShiftData, ShiftSchedule, ShiftTemplate } from "@/lib/shift-data"

const ALL_DEPARTMENTS = "すべてのセクション"

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
  const assignmentCoverage = useMemo<AssignmentCoverageGroup[]>(() => {
    return Object.entries(allShiftTemplates)
      .map(([templateId, template]) => {
        const typedTemplateId = templateId as ShiftTemplateId
        const assignments = selectedDateShifts
          .filter((shift) => shift.templateId === typedTemplateId)
          .sort((left, right) => left.start - right.start || left.memberId.localeCompare(right.memberId))
        const slotCounts = coverageTimeSlots.map((slotStart) => {
          const slotEnd = slotStart + COVERAGE_SLOT_MINUTES
          return assignments.filter((shift) => shift.start < slotEnd && shift.end > slotStart).length
        })
        return {
          templateId: typedTemplateId,
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

  const {
    beginCreateShift,
    moveCreateShift,
    beginCreateMobileShift,
    moveCreateMobileShift,
    finishCreateShift,
    cancelCreateShift,
    getCreatePreview,
    getMobileCreatePreview,
  } = useShiftCreationActions({
    editable: isAdmin,
    hasSchedule: shiftSchedule !== null,
    selectedDate,
    creatingShift,
    shiftsRef,
    initialShiftsRef: createInitialShiftsRef,
    templates: allShiftTemplates,
    setCreatingShift,
    setHoveredSlot,
    setDraftBaseShifts,
    setDraftShift,
    setShiftsWithoutHistory,
  })

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

  const {
    startMovePress,
    updateMovePress,
    cancelMovePress,
    moveShift,
    stopMove,
    cancelMove,
  } = useShiftMoveActions({
    editable: isAdmin,
    moving,
    shiftsRef,
    initialShiftsRef: moveInitialShiftsRef,
    pendingPressRef: pendingMovePressRef,
    didMoveRef: didMoveShiftRef,
    setMoving,
    setShiftsWithoutHistory,
    commitShiftPreview,
  })

  const { startResize, moveResize, stopResize, cancelResize } = useShiftResizeActions({
    editable: isAdmin,
    resizing,
    shiftsRef,
    initialShiftsRef: resizeInitialShiftsRef,
    didResizeRef: didResizeShiftRef,
    setResizing,
    setPendingAdjustment: setPendingShiftAdjustment,
    setShiftsWithoutHistory,
    commitShiftPreview,
  })

  const { startCopyShift, moveCopyShift, stopCopyShift, cancelCopyShift } = useShiftCopyActions({
    editable: isAdmin,
    copying,
    shiftsRef,
    setCopying,
    recordShiftsChange,
  })

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
      <ShiftHeader
        hasSchedule={shiftSchedule !== null}
        viewMode={shiftViewMode}
        selectedDate={selectedDate}
        dates={dateTabs}
        exportDisabled={exportableShifts.length === 0}
        onViewModeChange={setShiftViewMode}
        onDateChange={setSelectedDate}
        onExport={exportShifts}
      />

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
            <ShiftAssignmentView
              groups={assignmentCoverage}
              creationEnabled={SHIFT_CREATION_ENABLED}
              getTemplateColor={getShiftTemplateColor}
              getMemberName={memberName}
              onOpenDraft={openAssignmentDraft}
              onOpenShift={openShiftDetail}
            />
          ) : null}

          <ShiftMobileView
            visible={shiftViewMode === "member"}
            filterSummary={filterSummary}
            filtersOpen={filtersOpen && filterAnchor === "mobile"}
            hasNoFilterResults={hasNoFilterResults}
            pinnedMembers={visiblePinnedMembers}
            members={visibleInvitedMembers}
            pinnedMemberIds={visiblePinnedMemberIdSet}
            selectedDateShifts={selectedDateShifts}
            visibleDateShifts={visibleSelectedDateShifts}
            hoveredSlot={hoveredSlot}
            editable={isAdmin}
            templates={allShiftTemplates}
            getTemplateColor={getShiftTemplateColor}
            getCreatePreview={getMobileCreatePreview}
            onToggleFilters={(event) => toggleFilters("mobile", event)}
            onTogglePin={toggleMemberPin}
            onBeginCreate={beginCreateMobileShift}
            onMoveCreate={moveCreateMobileShift}
            onFinishCreate={finishCreateShift}
            onCancelCreate={cancelCreateShift}
            onLeaveTimeline={(memberId) => {
              if (!creatingShift || creatingShift.memberId !== memberId) {
                setHoveredSlot(null)
              }
            }}
            onClearHover={() => setHoveredSlot(null)}
            onOpenShift={openShiftDetail}
          />

          <ShiftDesktopView
            visible={shiftViewMode === "member"}
            filterSummary={filterSummary}
            filtersOpen={filtersOpen && filterAnchor === "table"}
            hasNoFilterResults={hasNoFilterResults}
            members={visibleInvitedMembers}
            pinnedMemberIds={visiblePinnedMemberIds}
            pinnedMemberIdSet={visiblePinnedMemberIdSet}
            selectedDateShifts={selectedDateShifts}
            visibleDateShifts={visibleSelectedDateShifts}
            hoveredSlot={hoveredSlot}
            creatingShift={creatingShift}
            moving={moving}
            resizing={resizing}
            copying={copying}
            copyingShift={copyingShift}
            editable={isAdmin}
            templates={allShiftTemplates}
            getTemplateColor={getShiftTemplateColor}
            getCreatePreview={getCreatePreview}
            onToggleFilters={(event) => toggleFilters("table", event)}
            onTogglePin={toggleMemberPin}
            onBeginCreate={beginCreateShift}
            onMoveCreate={moveCreateShift}
            onFinishCreate={finishCreateShift}
            onCancelCreate={cancelCreateShift}
            onLeaveTimeline={(memberId) => {
              if (!creatingShift || creatingShift.memberId !== memberId) {
                setHoveredSlot(null)
              }
            }}
            onClearHover={() => setHoveredSlot(null)}
            onOpenShift={openShiftDetail}
            onStartMovePress={startMovePress}
            onUpdateMovePress={updateMovePress}
            onMoveShift={moveShift}
            onStopMove={stopMove}
            onCancelMovePress={cancelMovePress}
            onCancelMove={cancelMove}
            onStartResize={startResize}
            onMoveResize={moveResize}
            onStopResize={stopResize}
            onCancelResize={cancelResize}
            onStartCopy={startCopyShift}
            onMoveCopy={moveCopyShift}
            onStopCopy={stopCopyShift}
            onCancelCopy={cancelCopyShift}
          />
        </>
      )}

      <ShiftDragOverlays
        moving={moving}
        movingShift={movingShift}
        copying={copying}
        copyingShift={copyingShift}
        templates={allShiftTemplates}
        getTemplateColor={getShiftTemplateColor}
      />

      {filtersOpen && filterPanelPosition
        ? createPortal(
          <ShiftFilterPanel
            panelRef={filterPanelRef}
            position={filterPanelPosition}
            shiftFilter={shiftFilter}
            shiftOptions={shiftFilterOptions}
            memberFilter={memberSearch}
            memberOptions={members.map((member) => member.name)}
            departmentFilter={departmentFilter}
            departmentOptions={departments}
            allDepartmentsValue={ALL_DEPARTMENTS}
            roleFilter={roleFilter}
            roleOptions={roles}
            onShiftFilterChange={setShiftFilter}
            onMemberFilterChange={setMemberSearch}
            onDepartmentFilterChange={setDepartmentFilter}
            onRoleFilterChange={setRoleFilter}
            onClear={() => {
              setShiftFilter("")
              setMemberSearch("")
              setDepartmentFilter(ALL_DEPARTMENTS)
              setRoleFilter("すべての役職")
            }}
            onClose={() => {
              setFiltersOpen(false)
              setFilterAnchor(null)
            }}
          />,
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
