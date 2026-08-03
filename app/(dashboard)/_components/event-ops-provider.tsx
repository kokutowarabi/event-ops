"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import type { EventOrganization, EventProject } from "@/lib/event-data"
import type { DashboardState } from "@/lib/initial-data"
import type { Member } from "@/lib/members"
import type { ShiftData } from "@/lib/shift-data"

type EventOpsContextValue = {
  members: Member[]
  setMembers: Dispatch<SetStateAction<Member[]>>
  deleteMember: (id: string) => void
  memberMemos: Record<string, string>
  setMemberMemo: (memberId: string, memo: string) => void
  organizations: EventOrganization[]
  setOrganizations: Dispatch<SetStateAction<EventOrganization[]>>
  deleteOrganization: (organization: EventOrganization) => void
  projects: EventProject[]
  setProjects: Dispatch<SetStateAction<EventProject[]>>
  getShiftData: (fallback: ShiftData) => ShiftData
  saveShiftData: (data: ShiftData) => void
}

const EventOpsContext = createContext<EventOpsContextValue | null>(null)

export function EventOpsProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState: DashboardState
}) {
  const [members, setMembers] = useState(initialState.members)
  const [memberMemos, setMemberMemos] = useState<Record<string, string>>({})
  const [organizations, setOrganizations] = useState(initialState.organizations)
  const [projects, setProjects] = useState(initialState.projects)
  const shiftDataRef = useRef<ShiftData | null>(null)

  const deleteMember = useCallback((id: string) => {
    setMembers((current) => current.filter((member) => member.id !== id))
    setMemberMemos((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  const setMemberMemo = useCallback((memberId: string, memo: string) => {
    setMemberMemos((current) => ({ ...current, [memberId]: memo }))
  }, [])

  const deleteOrganization = useCallback((organization: EventOrganization) => {
    setOrganizations((current) =>
      current.filter((item) => item.id !== organization.id),
    )
    setProjects((current) =>
      current.filter(
        (project) => project.organizationName !== organization.name,
      ),
    )
  }, [])

  const getShiftData = useCallback(
    (fallback: ShiftData) => shiftDataRef.current ?? fallback,
    [],
  )

  const saveShiftData = useCallback((data: ShiftData) => {
    shiftDataRef.current = data
  }, [])

  const value = useMemo<EventOpsContextValue>(
    () => ({
      members,
      setMembers,
      deleteMember,
      memberMemos,
      setMemberMemo,
      organizations,
      setOrganizations,
      deleteOrganization,
      projects,
      setProjects,
      getShiftData,
      saveShiftData,
    }),
    [
      deleteMember,
      deleteOrganization,
      getShiftData,
      memberMemos,
      members,
      organizations,
      projects,
      saveShiftData,
      setMemberMemo,
    ],
  )

  return (
    <EventOpsContext.Provider value={value}>
      {children}
    </EventOpsContext.Provider>
  )
}

export function useEventOps() {
  const context = useContext(EventOpsContext)
  if (!context) {
    throw new Error("useEventOps must be used within EventOpsProvider")
  }
  return context
}
