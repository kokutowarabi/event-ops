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
  orderMemberIdsWithPins,
  shiftTemplates,
  type ShiftTemplateColor,
} from "./shift-domain"

export const ALL_DEPARTMENTS = "すべてのセクション"
export const ALL_ROLES = "すべての役職"

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

  const invitedMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()
    const byDepartment =
      departmentFilter === ALL_DEPARTMENTS
        ? scheduledMembers
        : scheduledMembers.filter(
            (member) => member.department === departmentFilter,
          )
    const byRole =
      roleFilter === ALL_ROLES
        ? byDepartment
        : byDepartment.filter((member) =>
            parseMemberRoles(member.role).includes(roleFilter),
          )
    if (!query) return byRole
    return byRole.filter((member) =>
      [member.name, member.department, member.role].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [departmentFilter, memberSearch, roleFilter, scheduledMembers])

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
  const filteredMembers = useMemo(() => {
    if (!shiftFilter.trim()) return invitedMembers
    const visibleMemberIds = new Set(
      visibleSelectedDateShifts.map((shift) => shift.memberId),
    )
    return invitedMembers.filter((member) => visibleMemberIds.has(member.id))
  }, [invitedMembers, shiftFilter, visibleSelectedDateShifts])

  const visibleMemberOrder = useMemo(
    () =>
      orderMemberIdsWithPins(
        scheduledMembers.map((member) => member.id),
        filteredMembers.map((member) => member.id),
        pinnedMemberIds,
      ),
    [filteredMembers, pinnedMemberIds, scheduledMembers],
  )
  const membersById = useMemo(
    () => new Map(scheduledMembers.map((member) => [member.id, member])),
    [scheduledMembers],
  )
  const visibleMembers = useMemo(
    () =>
      visibleMemberOrder.flatMap((memberId) => {
        const member = membersById.get(memberId)
        return member ? [member] : []
      }),
    [membersById, visibleMemberOrder],
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
    () =>
      visiblePinnedMemberIds.flatMap((memberId) => {
        const member = membersById.get(memberId)
        return member ? [member] : []
      }),
    [membersById, visiblePinnedMemberIds],
  )

  const exportableShifts = useMemo(() => {
    const visibleMemberIds = new Set(filteredMembers.map((member) => member.id))
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
  }, [filteredMembers, members, visibleSelectedDateShifts])
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
    hasNoFilterResults: hasActiveFilters && filteredMembers.length === 0,
    shiftFilterOptions,
    assignmentCoverage,
  }
}
