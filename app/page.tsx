"use client"

import { useCallback, useEffect, useState, type ComponentType, type FormEvent } from "react"
import {
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  Columns3,
  Copy,
  Globe2,
  LogIn,
  LogOut,
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
import { Input } from "@/components/ui/input"
import {
  clearDemoState,
  createInitialDemoState,
  readDemoState,
  writeDemoState,
} from "@/lib/demo-storage"
import type { EventOrganization, EventProject } from "@/lib/event-data"
import type { Member } from "@/lib/members"
import { demoAdminAccount, siteConfig } from "@/lib/site-config"

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
const demoAuthStorageKey = "hoshihama-eventops-demo-authenticated"

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
  const [authReady, setAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authDraft, setAuthDraft] = useState({
    email: demoAdminAccount.email,
    password: demoAdminAccount.password,
  })
  const [authError, setAuthError] = useState("")
  const [copiedCredential, setCopiedCredential] = useState<"email" | "password" | null>(null)

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
      setIsAuthenticated(window.sessionStorage.getItem(demoAuthStorageKey) === "true")
      setAuthReady(true)
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

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const emailMatches = authDraft.email.trim().toLowerCase() === demoAdminAccount.email
    const passwordMatches = authDraft.password === demoAdminAccount.password

    if (!emailMatches || !passwordMatches) {
      setAuthError("メールアドレスまたはパスワードが違います。")
      return
    }

    window.sessionStorage.setItem(demoAuthStorageKey, "true")
    setAuthError("")
    setIsAuthenticated(true)
  }

  const logout = () => {
    window.sessionStorage.removeItem(demoAuthStorageKey)
    setIsAuthenticated(false)
  }

  const copyCredential = async (kind: "email" | "password", value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedCredential(kind)
    window.setTimeout(() => setCopiedCredential(null), 1600)
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

  if (!authReady) {
    return (
      <main className="flex h-svh items-center justify-center bg-background p-4">
        <p className="text-sm text-muted-foreground">{siteConfig.appName} を読み込んでいます…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
        <section className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm" aria-labelledby="login-title">
          <div className="text-xs font-bold tracking-[0.16em] text-muted-foreground">{siteConfig.universityName}</div>
          <h1 id="login-title" className="mt-1 text-2xl font-bold">{siteConfig.appName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            実行委員向け管理画面のデモ用ログインです。
          </p>

          <form className="mt-6 grid gap-4" onSubmit={submitAuth}>
            <label className="grid gap-1.5 text-sm font-medium">
              メールアドレス
              <Input
                type="email"
                autoComplete="username"
                value={authDraft.email}
                onChange={(event) => setAuthDraft((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              パスワード
              <Input
                type="password"
                autoComplete="current-password"
                value={authDraft.password}
                onChange={(event) => setAuthDraft((prev) => ({ ...prev, password: event.target.value }))}
              />
            </label>
            {authError ? <p className="text-sm text-destructive" role="alert">{authError}</p> : null}
            <Button type="submit" className="w-full">
              <LogIn className="size-4" />
              デモへログイン
            </Button>
          </form>

          <div className="mt-6 rounded-lg border bg-muted/40 p-3 text-xs">
            <div className="mb-2 font-semibold">デモ用アカウント</div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">メール: {demoAdminAccount.email}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => copyCredential("email", demoAdminAccount.email)}
                aria-label="デモ用メールアドレスをコピー"
              >
                {copiedCredential === "email" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>パスワード: {demoAdminAccount.password}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => copyCredential("password", demoAdminAccount.password)}
                aria-label="デモ用パスワードをコピー"
              >
                {copiedCredential === "password" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            ポートフォリオ用の簡易デモです。実際の認証・認可は行いません。
          </p>
        </section>
      </main>
    )
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
          <Button type="button" variant="ghost" size="sm" onClick={logout} aria-label="デモからログアウト">
            <LogOut className="size-4" />
            <span className="hidden 2xl:inline">ログアウト</span>
          </Button>
        </div>
      </nav>
      <div className="min-h-0 flex-1">{renderView()}</div>
    </main>
  )
}
