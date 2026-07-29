"use client"

import { useMemo } from "react"
import { RosterManager } from "@/components/roster-manager"
import { useEventOps } from "@/components/dashboard/event-ops-provider"
import { parseMemberRoles } from "@/lib/member-role"

export function RosterView() {
  const { members, setMembers, deleteMember } = useEventOps()
  const departments = useMemo(
    () => Array.from(new Set(members.map((member) => member.department))),
    [members],
  )
  const roles = useMemo(
    () =>
      Array.from(
        new Set(members.flatMap((member) => parseMemberRoles(member.role))),
      ),
    [members],
  )

  return (
    <RosterManager
      members={members}
      departments={departments}
      roles={roles}
      onMembersChange={setMembers}
      onDeleteMember={deleteMember}
    />
  )
}
