"use client"

import { useEffect, useMemo, useState, type TouchEvent } from "react"
import { Building2, CalendarDays, Camera, ClipboardList, Copy, Globe2, LogOut, Map, Users, Vote } from "lucide-react"
import { CampusGame } from "@/components/campus-game"
import { MobileCamera } from "@/components/mobile-camera"
import { OrganizationManager } from "@/components/organization-manager"
import { OfficialSite } from "@/components/official-site"
import { ProjectManager } from "@/components/project-manager"
import { ProjectVote } from "@/components/project-vote"
import { RosterManager } from "@/components/roster-manager"
import { ShiftManager } from "@/components/shift-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialOrganizations, initialProjects } from "@/lib/event-data"
import type { EventOrganization, EventProject } from "@/lib/event-data"
import { initialMembers, type Member } from "@/lib/members"

type View = "shift" | "roster" | "organizations" | "projects" | "campus" | "vote" | "official" | "camera"
type Role = "admin" | "member"
type Account = { id: string; name: string; email: string; password: string; role: Role }
const loginCookieKey = "event-ops-current-account"

const adminAccount: Account = {
  id: "admin",
  name: "開発管理者",
  email: "admin@event.local",
  password: "admin1234",
  role: "admin",
}

const memberViews: View[] = ["official", "shift", "vote", "campus", "camera"]
const adminViews: View[] = ["official", "shift", "roster", "organizations", "projects", "vote", "campus", "camera"]

function getStoredAccount() {
  if (typeof document === "undefined") return null
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${loginCookieKey}=`))
  const savedAccount = cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null
  if (!savedAccount) return null
  try {
    return JSON.parse(savedAccount) as Account
  } catch {
    clearStoredAccount()
    return null
  }
}

function saveStoredAccount(account: Account) {
  document.cookie = `${loginCookieKey}=${encodeURIComponent(JSON.stringify(account))}; path=/; max-age=2592000; SameSite=Lax`
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
  const [accounts, setAccounts] = useState<Account[]>(() => storedAccount && storedAccount.id !== adminAccount.id ? [adminAccount, storedAccount] : [adminAccount])
  const [currentAccount, setCurrentAccount] = useState<Account | null>(() => storedAccount)
  const [authDraft, setAuthDraft] = useState({ name: "", email: "", password: "" })
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const allowedViews = useMemo(() => (currentAccount?.role === "admin" ? adminViews : memberViews), [currentAccount])
  const effectiveView = allowedViews.includes(view) ? view : allowedViews[0]

  useEffect(() => {
    fetch("/api/app-data")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.members)) setMembers(data.members)
        if (Array.isArray(data.organizations)) setOrganizations(data.organizations)
        if (Array.isArray(data.projects)) setProjects(data.projects)
      })
      .catch(() => undefined)
  }, [])

  const persistData = (next: { members?: Member[]; organizations?: EventOrganization[]; projects?: EventProject[] }) => {
    const payload = {
      members: next.members ?? members,
      organizations: next.organizations ?? organizations,
      projects: next.projects ?? projects,
    }
    fetch("/api/app-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined)
  }

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
      setCurrentAccount(account)
      saveStoredAccount(account)
      return
    }
    const account = accounts.find((item) => item.email === email && item.password === password)
    if (account) {
      setCurrentAccount(account)
      saveStoredAccount(account)
    }
  }

  const logout = () => {
    clearStoredAccount()
    setCurrentAccount(null)
  }

  const copyText = (value: string) => {
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

    const copied = document.execCommand("copy")
    document.body.removeChild(input)

    if (!copied && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => undefined)
    }
  }

  const submitAuthFromTouch = (event: TouchEvent<HTMLButtonElement>) => {
    event.preventDefault()
    submitAuth()
  }

  const toggleAuthModeFromTouch = (event: TouchEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setAuthMode((prev) => (prev === "login" ? "signup" : "login"))
  }

  const copyTextFromTouch = (event: TouchEvent<HTMLButtonElement>, value: string) => {
    event.preventDefault()
    copyText(value)
  }

  const deleteMember = (id: string) => {
    changeMembers((prev) => prev.filter((member) => member.id !== id))
  }

  const deleteOrganization = (organization: EventOrganization) => {
    changeOrganizations((prev) => prev.filter((item) => item.id !== organization.id))
    changeProjects((prev) => prev.filter((project) => project.organizationName !== organization.name))
  }

  const renderView = () => {
    if (effectiveView === "roster") return <RosterManager members={members} onMembersChange={changeMembers} onDeleteMember={deleteMember} />
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
    if (effectiveView === "campus") return <CampusGame />
    if (effectiveView === "vote") return <ProjectVote projects={projects} />
    if (effectiveView === "official") return <OfficialSite projects={projects} />
    if (effectiveView === "camera") return <MobileCamera />
    return <ShiftManager members={members} />
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
            <Button type="button" onClick={submitAuth} onTouchEnd={submitAuthFromTouch}>{authMode === "login" ? "ログイン" : "アカウント作成"}</Button>
            <Button type="button" variant="ghost" onClick={() => setAuthMode((prev) => (prev === "login" ? "signup" : "login"))} onTouchEnd={toggleAuthModeFromTouch}>
              {authMode === "login" ? "アカウントを作成" : "ログインへ戻る"}
            </Button>
          </div>
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>管理者メール: {adminAccount.email}</span>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => copyText(adminAccount.email)} onTouchEnd={(event) => copyTextFromTouch(event, adminAccount.email)} aria-label="管理者メールをコピー">
                <Copy className="size-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>管理者パスワード: {adminAccount.password}</span>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => copyText(adminAccount.password)} onTouchEnd={(event) => copyTextFromTouch(event, adminAccount.password)} aria-label="管理者パスワードをコピー">
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background">
      <nav className="flex h-16 shrink-0 items-center gap-2 overflow-x-auto border-b px-4">
        <div className="mr-4 shrink-0 text-lg font-semibold">Event Ops</div>
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
        <Button type="button" variant="ghost" onClick={logout} className="ml-auto">
          <LogOut className="size-4" />
          {currentAccount.name}
        </Button>
      </nav>
      <div className="min-h-0 flex-1">{renderView()}</div>
    </main>
  )
}
