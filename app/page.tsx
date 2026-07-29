"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react"
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  MonitorSmartphone,
  Users,
} from "lucide-react"
import { OrganizationManager } from "@/components/organization-manager"
import { ProjectManager } from "@/components/project-manager"
import { ProjectVote, type VoteConnectionState } from "@/components/project-vote"
import { RosterManager } from "@/components/roster-manager"
import { ShiftManager, type ShiftData } from "@/components/shift-manager"
import { SitePreview } from "@/components/site-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EventOrganization, EventProject } from "@/lib/event-data"
import { createInitialAppState } from "@/lib/initial-data"
import type { Member } from "@/lib/members"
import { siteConfig } from "@/lib/site-config"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import {
  castVisitorVote,
  fetchVisitorVotes,
  type VisitorVote,
} from "@/lib/supabase/votes"

type View = "organizations" | "projects" | "roster" | "shift" | "preview" | "vote"

type ViewItem = {
  id: View
  label: string
  icon: ComponentType<{ className?: string }>
}

const viewItems: ViewItem[] = [
  { id: "roster", label: "名簿", icon: Users },
  { id: "organizations", label: "参加団体", icon: Building2 },
  { id: "projects", label: "企画", icon: ClipboardList },
  { id: "shift", label: "シフト", icon: CalendarDays },
  { id: "preview", label: "サイトプレビュー", icon: MonitorSmartphone },
  { id: "vote", label: "投票結果", icon: BarChart3 },
]

const initialData = createInitialAppState()

export default function Page() {
  const voteClient = useMemo(() => getSupabaseClient(), [])
  const [view, setView] = useState<View>("roster")
  const [members, setMembers] = useState<Member[]>(initialData.members)
  const [organizations, setOrganizations] = useState<EventOrganization[]>(initialData.organizations)
  const [projects, setProjects] = useState<EventProject[]>(initialData.projects)
  const [shiftData, setShiftData] = useState<ShiftData>(initialData.shiftData)
  const [votes, setVotes] = useState<VisitorVote[]>([])
  const [voteConnectionState, setVoteConnectionState] = useState<VoteConnectionState>(
    isSupabaseConfigured ? "connecting" : "unconfigured",
  )

  useEffect(() => {
    if (!voteClient) return
    let active = true

    const loadVotes = async () => {
      try {
        const nextVotes = await fetchVisitorVotes(voteClient)
        if (active) setVotes(nextVotes)
      } catch {
        if (active) setVoteConnectionState("error")
      }
    }

    loadVotes()

    const channel = voteClient
      .channel("visitor-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitor_votes",
        },
        loadVotes,
      )
      .subscribe((status) => {
        if (!active) return
        if (status === "SUBSCRIBED") setVoteConnectionState("realtime")
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setVoteConnectionState("error")
        }
      })

    return () => {
      active = false
      voteClient.removeChannel(channel)
    }
  }, [voteClient])

  const changeMembers = (updater: Member[] | ((prev: Member[]) => Member[])) => {
    setMembers(updater)
  }

  const changeOrganizations = (
    updater: EventOrganization[] | ((prev: EventOrganization[]) => EventOrganization[]),
  ) => {
    setOrganizations(updater)
  }

  const changeProjects = (
    updater: EventProject[] | ((prev: EventProject[]) => EventProject[]),
  ) => {
    setProjects(updater)
  }

  const changeShiftData = useCallback((data: ShiftData) => {
    setShiftData(data)
  }, [])

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
  }

  const deleteOrganization = (organization: EventOrganization) => {
    setOrganizations((prev) => prev.filter((item) => item.id !== organization.id))
    setProjects((prev) =>
      prev.filter((project) => project.organizationName !== organization.name),
    )
  }

  const castPreviewVote = useCallback(
    async (deviceId: string, projectId: string, votedOn: string) => {
      if (!voteClient) throw new Error("Supabase is not configured")
      await castVisitorVote(voteClient, deviceId, projectId, votedOn)
      setVotes(await fetchVisitorVotes(voteClient))
    },
    [voteClient],
  )

  const renderView = () => {
    if (view === "organizations") {
      return (
        <OrganizationManager
          organizations={organizations}
          onOrganizationsChange={changeOrganizations}
          onDeleteOrganization={deleteOrganization}
        />
      )
    }
    if (view === "projects") {
      return <ProjectManager projects={projects} onProjectsChange={changeProjects} />
    }
    if (view === "roster") {
      return (
        <RosterManager
          members={members}
          departments={Array.from(new Set(members.map((member) => member.department)))}
          roles={Array.from(new Set(members.map((member) => member.role)))}
          onMembersChange={changeMembers}
          onDeleteMember={deleteMember}
        />
      )
    }
    if (view === "shift") {
      return (
        <ShiftManager
          members={members}
          initialShiftData={shiftData}
          onShiftDataChange={changeShiftData}
        />
      )
    }
    if (view === "preview") {
      return (
        <SitePreview
          projects={projects}
          votingConfigured={Boolean(voteClient)}
          onVote={castPreviewVote}
        />
      )
    }
    return (
      <ProjectVote
        projects={projects}
        votes={votes}
        connectionState={voteConnectionState}
      />
    )
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background">
      <nav className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4" aria-label="管理画面">
        <div className="mr-3 shrink-0">
          <div className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground">
            {siteConfig.universityName}
          </div>
          <div className="text-base font-bold leading-tight">{siteConfig.appName}</div>
        </div>

        <select
          value={view}
          onChange={(event) => setView(event.target.value as View)}
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm md:hidden"
          aria-label="画面を選択"
        >
          {viewItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
          {viewItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={view === item.id ? "default" : "ghost"}
                onClick={() => setView(item.id)}
              >
                <Icon className="size-4" />
                {item.label}
              </Button>
            )
          })}
        </div>

        <Badge variant="outline" className="ml-auto hidden lg:inline-flex">
          運営データは保存なし
        </Badge>
      </nav>
      <div className="min-h-0 flex-1">{renderView()}</div>
    </main>
  )
}
