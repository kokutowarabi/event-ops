"use client"

import { useMemo } from "react"
import { useEventOps } from "../event-ops-provider"
import { RosterManager } from "./roster-manager"
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
