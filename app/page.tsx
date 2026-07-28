"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Building2, CalendarDays, Camera, Check, ClipboardList, Columns3, Copy, FileText, Globe2, LogOut, Map, ShieldCheck, Users, Vote } from "lucide-react"
import { CampusGame } from "@/components/campus-game"
import { DtpStudio } from "@/components/dtp-studio"
import { KanbanBoard } from "@/components/kanban-board"
import { MobileCamera } from "@/components/mobile-camera"
import { OrganizationManager } from "@/components/organization-manager"
import { OfficialSite } from "@/components/official-site"
import { PermissionManager } from "@/components/permission-manager"
import { ProjectManager } from "@/components/project-manager"
import { ProjectVote } from "@/components/project-vote"
import { RosterManager } from "@/components/roster-manager"
import { emptyShiftData, ShiftManager, type ShiftData } from "@/components/shift-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialOrganizations, initialProjects } from "@/lib/event-data"
import type { EventOrganization, EventProject } from "@/lib/event-data"
import { initialMembers, type Member } from "@/lib/members"
import {
  defaultPermissionSettings,
  getAllowedViewsForAccount,
  normalizePermissionSettings,
  type AppView,
  type PermissionSettings,
} from "@/lib/permissions"

type View = AppView
type Role = "admin" | "member"
type Account = { id: string; name: string; email: string; password: string; role: Role }
type StoredAccount = Omit<Account, "password">
const loginCookieKey = "event-ops-current-account"

const adminAccount: Account = {
  id: "admin",
  name: "開発管理者",
  email: "ops.admin@example.invalid",
  password: "EventOps-2026!Local",
  role: "admin",
}

const viewLabels: Record<View, string> = {
  official: "公式サイト",
  shift: "シフト",
  roster: "名簿",
  organizations: "団体",
  projects: "企画",
  permissions: "権限",
  dtp: "DTP",
  kanban: "カンバン",
  vote: "投票",
  campus: "キャンパス",
  camera: "カメラ",
}

function getStoredAccount() {
  if (typeof document === "undefined") return null
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${loginCookieKey}=`))
  const savedAccount = cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null
  if (!savedAccount) return null
  try {
    const account = JSON.parse(savedAccount) as Partial<Account>
    if (!account.id || !account.name || !account.email || !account.role) return null
    return { id: account.id, name: account.name, email: account.email, role: account.role } as StoredAccount
  } catch {
    clearStoredAccount()
    return null
  }
}

function saveStoredAccount(account: Account) {
  const storedAccount: StoredAccount = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  }
  document.cookie = `${loginCookieKey}=${encodeURIComponent(JSON.stringify(storedAccount))}; path=/; max-age=2592000; SameSite=Lax`
}

function clearStoredAccount() {
  document.cookie = `${loginCookieKey}=; path=/; max-age=0; SameSite=Lax`
}

export default function Page() {
  const storedAccount = useMemo(() => getStoredAccount(), [])
  const [view, setView] = useState<View>("shift")
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [organizations, setOrganizations] = useState<EventOrganization[]>(initialOrganizations)
  const [projects, setProjects] = useState<EventProject[]>(initialProjects)
  const [shiftDataByAccount, setShiftDataByAccount] = useState<Record<string, ShiftData>>({})
  const [permissionSettings, setPermissionSettings] = useState<PermissionSettings>(defaultPermissionSettings)
  const [accounts, setAccounts] = useState<Account[]>([adminAccount])
  const [currentAccount, setCurrentAccount] = useState<StoredAccount | null>(() => storedAccount)
  const [authDraft, setAuthDraft] = useState({ name: "", email: "", password: "" })
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [copiedCredential, setCopiedCredential] = useState<"email" | "password" | null>(null)
  const [appDataLoaded, setAppDataLoaded] = useState(false)
  const latestDataRef = useRef({ members, organizations, projects, shiftDataByAccount, permissionSettings })
  const allowedViews = useMemo(
    () => getAllowedViewsForAccount(currentAccount, members, permissionSettings),
    [currentAccount, members, permissionSettings],
  )
  const effectiveView = allowedViews.includes(view) ? view : allowedViews[0]

  useEffect(() => {
    latestDataRef.current = { members, organizations, projects, shiftDataByAccount, permissionSettings }
  }, [members, organizations, projects, shiftDataByAccount, permissionSettings])

  useEffect(() => {
    fetch("/api/app-data")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.members)) setMembers(data.members)
        if (Array.isArray(data.organizations)) setOrganizations(data.organizations)
        if (Array.isArray(data.projects)) setProjects(data.projects)
        if (data.shiftDataByAccount && typeof data.shiftDataByAccount === "object") setShiftDataByAccount(data.shiftDataByAccount)
        setPermissionSettings(normalizePermissionSettings(data.permissionSettings))
      })
      .catch(() => undefined)
      .finally(() => setAppDataLoaded(true))
  }, [])

  const persistData = useCallback((next: { members?: Member[]; organizations?: EventOrganization[]; projects?: EventProject[]; shiftDataByAccount?: Record<string, ShiftData>; permissionSettings?: PermissionSettings }) => {
    const current = latestDataRef.current
    const payload = {
      members: next.members ?? current.members,
      organizations: next.organizations ?? current.organizations,
      projects: next.projects ?? current.projects,
      shiftDataByAccount: next.shiftDataByAccount ?? current.shiftDataByAccount,
      permissionSettings: next.permissionSettings ?? current.permissionSettings,
    }
    fetch("/api/app-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined)
  }, [])

  const changeMembers = (updater: Member[] | ((prev: Member[]) => Member[])) => {
    setMembers((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      persistData({ members: next })
      return next
    })
  }

  const changeOrganizations = (updater: EventOrganization[] | ((prev: EventOrganization[]) => EventOrganization[])) => {
    setOrganizations((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      persistData({ organizations: next })
      return next
    })
  }

  const changeProjects = (updater: EventProject[] | ((prev: EventProject[]) => EventProject[])) => {
    setProjects((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      persistData({ projects: next })
      return next
    })
  }

  const changeShiftData = useCallback((data: ShiftData) => {
    if (!currentAccount || !appDataLoaded) return
    setShiftDataByAccount((prev) => {
      const next = { ...prev, [currentAccount.id]: data }
      persistData({ shiftDataByAccount: next })
      return next
    })
  }, [appDataLoaded, currentAccount, persistData])

  const changePermissionSettings = (settings: PermissionSettings) => {
    setPermissionSettings(settings)
    persistData({ permissionSettings: settings })
  }

  const submitAuth = () => {
    const email = authDraft.email.trim()
    const password = authDraft.password
    if (!email || !password) return
    if (authMode === "signup") {
      const account: Account = {
        id: crypto.randomUUID(),
        name: authDraft.name.trim() || email,
        email,
        password,
        role: "member",
      }
      setAccounts((prev) => [...prev, account])
      setCurrentAccount({ id: account.id, name: account.name, email: account.email, role: account.role })
      saveStoredAccount(account)
      return
    }
    const account = accounts.find((item) => item.email === email && item.password === password)
    if (account) {
      setCurrentAccount({ id: account.id, name: account.name, email: account.email, role: account.role })
      saveStoredAccount(account)
    }
  }

  const logout = () => {
    clearStoredAccount()
    setCurrentAccount(null)
  }

  const copyText = async (kind: "email" | "password", value: string) => {
    let copied = false
    const input = document.createElement("input")
    input.value = value
    input.setAttribute("readonly", "")
    input.style.position = "fixed"
    input.style.top = "0"
    input.style.left = "0"
    input.style.width = "1px"
    input.style.height = "1px"
    input.style.opacity = "0"
    input.style.fontSize = "16px"
    document.body.appendChild(input)
    input.focus({ preventScroll: true })
    input.select()
    input.setSelectionRange(0, value.length)

    copied = document.execCommand("copy")
    document.body.removeChild(input)

    if (!copied && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(value)
        copied = true
      } catch {
        copied = false
      }
    }
    if (copied) {
      setCopiedCredential(kind)
      window.setTimeout(() => setCopiedCredential(null), 1600)
    }
  }

  const deleteMember = (id: string) => {
    changeMembers((prev) => prev.filter((member) => member.id !== id))
  }

  const deleteOrganization = (organization: EventOrganization) => {
    changeOrganizations((prev) => prev.filter((item) => item.id !== organization.id))
    changeProjects((prev) => prev.filter((project) => project.organizationName !== organization.name))
  }

  const renderView = () => {
    if (effectiveView === "permissions") return <PermissionManager members={members} settings={permissionSettings} onSettingsChange={changePermissionSettings} />
    if (effectiveView === "roster") {
      return (
        <RosterManager
          members={members}
          departments={permissionSettings.departments}
          roles={permissionSettings.roles}
          onMembersChange={changeMembers}
          onDeleteMember={deleteMember}
        />
      )
    }
    if (effectiveView === "organizations") {
      return (
        <OrganizationManager
          organizations={organizations}
          onOrganizationsChange={changeOrganizations}
          onDeleteOrganization={deleteOrganization}
        />
      )
    }
    if (effectiveView === "projects") return <ProjectManager projects={projects} onProjectsChange={changeProjects} />
    if (effectiveView === "dtp") return <DtpStudio organizations={organizations} projects={projects} />
    if (effectiveView === "kanban") return <KanbanBoard projects={projects} onProjectsChange={changeProjects} />
    if (effectiveView === "campus") return <CampusGame />
    if (effectiveView === "vote") return <ProjectVote projects={projects} />
    if (effectiveView === "official") return <OfficialSite projects={projects} />
    if (effectiveView === "camera") return <MobileCamera />
    if (!appDataLoaded) return <div className="grid h-full place-items-center text-sm text-muted-foreground">読み込み中</div>
    return (
      <ShiftManager
        key={currentAccount?.id}
        members={members}
        initialShiftData={currentAccount ? shiftDataByAccount[currentAccount.id] ?? emptyShiftData : emptyShiftData}
        onShiftDataChange={changeShiftData}
      />
    )
  }

  if (!currentAccount) {
    return (
      <main className="flex h-svh items-center justify-center bg-background p-4">
        <section className="w-full max-w-sm rounded-lg border bg-card p-4">
          <h1 className="text-xl font-semibold">Event Ops ログイン</h1>
          <div className="mt-4 grid gap-2">
            {authMode === "signup" ? (
              <Input value={authDraft.name} onChange={(event) => setAuthDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="名前" />
            ) : null}
            <Input value={authDraft.email} onChange={(event) => setAuthDraft((prev) => ({ ...prev, email: event.target.value }))} placeholder="メール" />
            <Input type="password" value={authDraft.password} onChange={(event) => setAuthDraft((prev) => ({ ...prev, password: event.target.value }))} placeholder="パスワード" />
            <Button type="button" onClick={submitAuth}>{authMode === "login" ? "ログイン" : "アカウント作成"}</Button>
            <Button type="button" variant="ghost" onClick={() => setAuthMode((prev) => (prev === "login" ? "signup" : "login"))}>
              {authMode === "login" ? "アカウントを作成" : "ログインへ戻る"}
            </Button>
          </div>
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>管理者メール: {adminAccount.email}</span>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => copyText("email", adminAccount.email)} aria-label="管理者メールをコピー">
                {copiedCredential === "email" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>管理者パスワード: {adminAccount.password}</span>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => copyText("password", adminAccount.password)} aria-label="管理者パスワードをコピー">
                {copiedCredential === "password" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background">
      <nav className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <div className="mr-4 shrink-0 text-lg font-semibold">Event Ops</div>
        <select
          value={effectiveView}
          onChange={(event) => setView(event.target.value as View)}
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm md:hidden"
          aria-label="画面を選択"
        >
          {allowedViews.map((item) => (
            <option key={item} value={item}>
              {viewLabels[item]}
            </option>
          ))}
        </select>
        <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto md:flex">
        {allowedViews.includes("official") ? <Button
          type="button"
          variant={effectiveView === "official" ? "default" : "ghost"}
          onClick={() => setView("official")}
        >
          <Globe2 className="size-4" />
          公式サイト
        </Button> : null}
        {allowedViews.includes("shift") ? <Button
          type="button"
          variant={effectiveView === "shift" ? "default" : "ghost"}
          onClick={() => setView("shift")}
        >
          <CalendarDays className="size-4" />
          シフト
        </Button> : null}
        {allowedViews.includes("roster") ? <Button
          type="button"
          variant={effectiveView === "roster" ? "default" : "ghost"}
          onClick={() => setView("roster")}
        >
          <Users className="size-4" />
          名簿
        </Button> : null}
        {allowedViews.includes("permissions") ? <Button
          type="button"
          variant={effectiveView === "permissions" ? "default" : "ghost"}
          onClick={() => setView("permissions")}
        >
          <ShieldCheck className="size-4" />
          権限
        </Button> : null}
        {allowedViews.includes("organizations") ? <Button
          type="button"
          variant={effectiveView === "organizations" ? "default" : "ghost"}
          onClick={() => setView("organizations")}
        >
          <Building2 className="size-4" />
          団体
        </Button> : null}
        {allowedViews.includes("projects") ? <Button
          type="button"
          variant={effectiveView === "projects" ? "default" : "ghost"}
          onClick={() => setView("projects")}
        >
          <ClipboardList className="size-4" />
          企画
        </Button> : null}
        {allowedViews.includes("dtp") ? <Button
          type="button"
          variant={effectiveView === "dtp" ? "default" : "ghost"}
          onClick={() => setView("dtp")}
        >
          <FileText className="size-4" />
          DTP
        </Button> : null}
        {allowedViews.includes("kanban") ? <Button
          type="button"
          variant={effectiveView === "kanban" ? "default" : "ghost"}
          onClick={() => setView("kanban")}
        >
          <Columns3 className="size-4" />
          カンバン
        </Button> : null}
        {allowedViews.includes("vote") ? <Button
          type="button"
          variant={effectiveView === "vote" ? "default" : "ghost"}
          onClick={() => setView("vote")}
        >
          <Vote className="size-4" />
          投票
        </Button> : null}
        {allowedViews.includes("campus") ? <Button
          type="button"
          variant={effectiveView === "campus" ? "default" : "ghost"}
          onClick={() => setView("campus")}
        >
          <Map className="size-4" />
          キャンパス
        </Button> : null}
        {allowedViews.includes("camera") ? <Button
          type="button"
          variant={effectiveView === "camera" ? "default" : "ghost"}
          onClick={() => setView("camera")}
        >
          <Camera className="size-4" />
          カメラ
        </Button> : null}
        </div>
        <Button type="button" variant="ghost" onClick={logout} className="ml-auto shrink-0">
          <LogOut className="size-4" />
          <span className="hidden sm:inline">ログアウト</span>
        </Button>
      </nav>
      <div className="min-h-0 flex-1">{renderView()}</div>
    </main>
  )
}
