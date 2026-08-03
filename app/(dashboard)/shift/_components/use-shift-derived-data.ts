import { useCallback, useMemo } from "react"
import { parseMemberRoles } from "@/lib/member-role"
import type { Member } from "@/lib/members"
import type {
  Shift,
  ShiftSchedule,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
import { createAssignmentCoverage } from "./shift-coverage"
import {
  addDays,
  createShiftTemplateColor,
  dateDiff,
  shiftTemplates,
  type ShiftTemplateColor,
} from "./shift-domain"
import { ALL_DEPARTMENTS, ALL_ROLES } from "./shift-filter-values"
import { useShiftMemberVisibility } from "./use-shift-member-visibility"

type ShiftDerivedDataOptions = {
  members: Member[]
  schedule: ShiftSchedule | null
  selectedDate: string
  shifts: Shift[]
  customTemplates: Record<ShiftTemplateId, ShiftTemplate>
  selectedShiftId: string | null
  shiftFilter: string
  memberSearch: string
  departmentFilter: string
  roleFilter: string
  pinnedMemberIds: string[]
}

export function useShiftDerivedData({
  members,
  schedule,
  selectedDate,
  shifts,
  customTemplates,
  selectedShiftId,
  shiftFilter,
  memberSearch,
  departmentFilter,
  roleFilter,
  pinnedMemberIds,
}: ShiftDerivedDataOptions) {
  const memberIds = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  )
  const selectedShift =
    shifts.find(
      (shift) => shift.id === selectedShiftId && memberIds.has(shift.memberId),
    ) ?? null
  const allShiftTemplates = useMemo(
    () => ({ ...shiftTemplates, ...customTemplates }),
    [customTemplates],
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
  const getShiftTemplateColor = useCallback(
    (templateId: ShiftTemplateId) =>
      shiftTemplateColors[templateId] ?? createShiftTemplateColor(0),
    [shiftTemplateColors],
  )
  const memberName = useCallback(
    (memberId: string) =>
      members.find((member) => member.id === memberId)?.name ?? "",
    [members],
  )

  const departments = useMemo(
    () =>
      Array.from(
        new Set(members.map((member) => member.department).filter(Boolean)),
      ).sort(),
    [members],
  )
  const roles = useMemo(
    () =>
      Array.from(
        new Set(members.flatMap((member) => parseMemberRoles(member.role))),
      ).sort(),
    [members],
  )
  const dateTabs = useMemo(() => {
    if (!schedule) return []
    return Array.from(
      { length: dateDiff(schedule.startDate, schedule.endDate) + 1 },
      (_, index) => addDays(schedule.startDate, index),
    )
  }, [schedule])
  const scheduledMembers = useMemo(() => {
    if (!schedule) return []
    return members.filter((member) => schedule.memberIds.includes(member.id))
  }, [members, schedule])

  const selectedDateShifts = useMemo(() => {
    if (!schedule) return []
    return shifts.filter(
      (shift) =>
        shift.date === selectedDate
        && schedule.memberIds.includes(shift.memberId)
        && memberIds.has(shift.memberId),
    )
  }, [memberIds, schedule, selectedDate, shifts])
  const visibleSelectedDateShifts = useMemo(() => {
    const query = shiftFilter.trim().toLowerCase()
    if (!query) return selectedDateShifts
    return selectedDateShifts.filter((shift) => {
      const template = allShiftTemplates[shift.templateId]
      return [template?.label, shift.note].some((value) =>
        value?.toLowerCase().includes(query),
      )
    })
  }, [allShiftTemplates, selectedDateShifts, shiftFilter])
  const {
    visibleMembers,
    visiblePinnedMemberIds,
    visiblePinnedMemberIdSet,
    visiblePinnedMembers,
    exportableShifts,
    filteredMemberCount,
  } = useShiftMemberVisibility({
    members,
    scheduledMembers,
    visibleShifts: visibleSelectedDateShifts,
    shiftFilter,
    memberSearch,
    departmentFilter,
    roleFilter,
    pinnedMemberIds,
  })
  const filterSummary = useMemo(
    () =>
      [
        shiftFilter ? `業務: ${shiftFilter}` : "",
        memberSearch ? `氏名: ${memberSearch}` : "",
        departmentFilter !== ALL_DEPARTMENTS ? `所属: ${departmentFilter}` : "",
        roleFilter !== ALL_ROLES ? `役職: ${roleFilter}` : "",
      ]
        .filter(Boolean)
        .join("・"),
    [departmentFilter, memberSearch, roleFilter, shiftFilter],
  )
  const hasActiveFilters = Boolean(
    shiftFilter.trim()
    || memberSearch.trim()
    || departmentFilter !== ALL_DEPARTMENTS
    || roleFilter !== ALL_ROLES
  )
  const shiftFilterOptions = useMemo(
    () =>
      [
        ...Object.values(allShiftTemplates).map((template) => template.label),
        ...selectedDateShifts.map((shift) => shift.note),
      ].filter(Boolean),
    [allShiftTemplates, selectedDateShifts],
  )
  const assignmentCoverage = useMemo(
    () => createAssignmentCoverage(allShiftTemplates, selectedDateShifts),
    [allShiftTemplates, selectedDateShifts],
  )

  return {
    selectedShift,
    allShiftTemplates,
    getShiftTemplateColor,
    memberName,
    departments,
    roles,
    dateTabs,
    scheduledMembers,
    selectedDateShifts,
    visibleSelectedDateShifts,
    visibleMembers,
    visiblePinnedMemberIds,
    visiblePinnedMemberIdSet,
    visiblePinnedMembers,
    exportableShifts,
    filterSummary,
    hasNoFilterResults: hasActiveFilters && filteredMemberCount === 0,
    shiftFilterOptions,
    assignmentCoverage,
  }
}
