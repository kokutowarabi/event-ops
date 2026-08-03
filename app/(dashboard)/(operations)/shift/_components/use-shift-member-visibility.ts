import { useMemo } from "react"
import { parseMemberRoles } from "@/lib/member-role"
import type { Member } from "@/lib/members"
import type { Shift } from "@/lib/shift-data"
import { orderMemberIdsWithPins } from "./shift-domain"
import { ALL_DEPARTMENTS, ALL_ROLES } from "./shift-filter-values"

type ShiftMemberVisibilityOptions = {
  members: Member[]
  scheduledMembers: Member[]
  visibleShifts: Shift[]
  shiftFilter: string
  memberSearch: string
  departmentFilter: string
  roleFilter: string
  pinnedMemberIds: string[]
}

export function useShiftMemberVisibility({
  members,
  scheduledMembers,
  visibleShifts,
  shiftFilter,
  memberSearch,
  departmentFilter,
  roleFilter,
  pinnedMemberIds,
}: ShiftMemberVisibilityOptions) {
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

  const filteredMembers = useMemo(() => {
    if (!shiftFilter.trim()) return invitedMembers
    const visibleMemberIds = new Set(visibleShifts.map((shift) => shift.memberId))
    return invitedMembers.filter((member) => visibleMemberIds.has(member.id))
  }, [invitedMembers, shiftFilter, visibleShifts])
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
    return visibleShifts
      .filter((shift) => visibleMemberIds.has(shift.memberId))
      .sort(
        (left, right) =>
          left.start - right.start
          || (memberNames.get(left.memberId) ?? "").localeCompare(
            memberNames.get(right.memberId) ?? "",
            "ja",
          ),
      )
  }, [filteredMembers, members, visibleShifts])

  return {
    visibleMembers,
    visiblePinnedMemberIds,
    visiblePinnedMemberIdSet,
    visiblePinnedMembers,
    exportableShifts,
    filteredMemberCount: filteredMembers.length,
  }
}
