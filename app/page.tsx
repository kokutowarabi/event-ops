"use client"

import { useCallback, useEffect, useState, type ComponentType } from "react"
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Columns3,
  Globe2,
  RotateCcw,
  Users,
} from "lucide-react"
import { KanbanBoard } from "@/components/kanban-board"
import { OrganizationManager } from "@/components/organization-manager"
import { OfficialSite } from "@/components/official-site"
import { ProjectManager } from "@/components/project-manager"
import { ProjectVote } from "@/components/project-vote"
import { RosterManager } from "@/components/roster-manager"
import { ShiftManager, type ShiftData } from "@/components/shift-manager"
import { Button } from "@/components/ui/button"
import {
  clearDemoState,
  createInitialDemoState,
  readDemoState,
  writeDemoState,
} from "@/lib/demo-storage"
import type { EventOrganization, EventProject } from "@/lib/event-data"
import type { Member } from "@/lib/members"
import { siteConfig } from "@/lib/site-config"

type View = "organizations" | "projects" | "kanban" | "roster" | "shift" | "vote" | "official"

type ViewItem = {
  id: View
  label: string
  icon: ComponentType<{ className?: string }>
}

const viewItems: ViewItem[] = [
  { id: "kanban", label: "カンバン", icon: Columns3 },
  { id: "organizations", label: "参加団体", icon: Building2 },
  { id: "projects", label: "企画", icon: ClipboardList },
  { id: "roster", label: "名簿", icon: Users },
  { id: "shift", label: "シフト", icon: CalendarDays },
  { id: "vote", label: "投票結果", icon: BarChart3 },
  { id: "official", label: "公式サイト", icon: Globe2 },
]

const initialDemoData = createInitialDemoState()

export default function Page() {
  const [view, setView] = useState<View>("kanban")
  const [members, setMembers] = useState<Member[]>(initialDemoData.members)
  const [organizations, setOrganizations] = useState<EventOrganization[]>(initialDemoData.organizations)
  const [projects, setProjects] = useState<EventProject[]>(initialDemoData.projects)
  const [shiftData, setShiftData] = useState<ShiftData>(initialDemoData.shiftData)
  const [votedProjectIds, setVotedProjectIds] = useState<string[]>(initialDemoData.votedProjectIds)
  const [storageReady, setStorageReady] = useState(false)
  const [resetVersion, setResetVersion] = useState(0)
  const [resetComplete, setResetComplete] = useState(false)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      const saved = readDemoState()
      setMembers(saved.members)
      setOrganizations(saved.organizations)
      setProjects(saved.projects)
      setShiftData(saved.shiftData)
      setVotedProjectIds(saved.votedProjectIds)
      setStorageReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    writeDemoState({ members, organizations, projects, shiftData, votedProjectIds })
  }, [members, organizations, projects, shiftData, storageReady, votedProjectIds])

  const changeMembers = (updater: Member[] | ((prev: Member[]) => Member[])) => {
    setMembers(updater)
  }

  const changeOrganizations = (updater: EventOrganization[] | ((prev: EventOrganization[]) => EventOrganization[])) => {
    setOrganizations(updater)
  }

  const changeProjects = (updater: EventProject[] | ((prev: EventProject[]) => EventProject[])) => {
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
    setProjects((prev) => prev.filter((project) => project.organizationName !== organization.name))
  }

  const toggleVote = (projectId: string) => {
    setVotedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const resetDemo = () => {
    if (!window.confirm("このブラウザに保存した編集内容と投票を初期状態へ戻しますか？")) return
    const next = createInitialDemoState()
    clearDemoState()
    setMembers(next.members)
    setOrganizations(next.organizations)
    setProjects(next.projects)
    setShiftData(next.shiftData)
    setVotedProjectIds(next.votedProjectIds)
    setView("kanban")
    setResetVersion((prev) => prev + 1)
    setResetComplete(true)
    window.setTimeout(() => setResetComplete(false), 1800)
  }

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
          key={resetVersion}
          members={members}
          initialShiftData={shiftData}
          onShiftDataChange={changeShiftData}
        />
      )
    }
    if (view === "vote") {
      return <ProjectVote projects={projects} votedProjectIds={votedProjectIds} />
    }
    if (view === "official") {
      return (
        <OfficialSite
          projects={projects}
          votedProjectIds={votedProjectIds}
          onToggleVote={toggleVote}
        />
      )
    }
    return <KanbanBoard projects={projects} onProjectsChange={changeProjects} />
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background">
      <nav className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4" aria-label="管理画面">
        <div className="mr-3 shrink-0">
          <div className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground">{siteConfig.universityName}</div>
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

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-muted-foreground xl:inline">
            {resetComplete ? "初期化しました" : "このブラウザに自動保存"}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={resetDemo} aria-label="デモデータを初期化">
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">初期化</span>
          </Button>
        </div>
      </nav>
      <div className="min-h-0 flex-1">{renderView()}</div>
    </main>
  )
}
