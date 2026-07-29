"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react"
import type { User } from "@supabase/supabase-js"
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Cloud,
  LogOut,
  RotateCcw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react"
import { LoginScreen } from "@/components/login-screen"
import { OrganizationManager } from "@/components/organization-manager"
import { ProjectManager } from "@/components/project-manager"
import { ProjectVote } from "@/components/project-vote"
import { RosterManager } from "@/components/roster-manager"
import { ShiftManager, type ShiftData } from "@/components/shift-manager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EventOrganization, EventProject } from "@/lib/event-data"
import {
  createInitialSharedState,
  isSharedAppState,
  type SharedAppState,
} from "@/lib/initial-data"
import type { Member } from "@/lib/members"
import { siteConfig } from "@/lib/site-config"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import {
  fetchVisitorVotes,
  loadOrCreateSharedState,
  saveSharedState,
  sharedStateId,
  type VisitorVote,
} from "@/lib/supabase/data"

type View = "organizations" | "projects" | "roster" | "shift" | "vote"
type SyncStatus = "loading" | "realtime" | "saving" | "saved" | "error"

type ViewItem = {
  id: View
  label: string
  icon: ComponentType<{ className?: string }>
}

const viewItems: ViewItem[] = [
  { id: "organizations", label: "参加団体", icon: Building2 },
  { id: "projects", label: "企画", icon: ClipboardList },
  { id: "roster", label: "名簿", icon: Users },
  { id: "shift", label: "シフト", icon: CalendarDays },
  { id: "vote", label: "投票結果", icon: BarChart3 },
]

const initialData = createInitialSharedState()

export default function Page() {
  const client = useMemo(() => getSupabaseClient(), [])
  const [view, setView] = useState<View>("organizations")
  const [members, setMembers] = useState<Member[]>(initialData.members)
  const [organizations, setOrganizations] = useState<EventOrganization[]>(initialData.organizations)
  const [projects, setProjects] = useState<EventProject[]>(initialData.projects)
  const [shiftData, setShiftData] = useState<ShiftData>(initialData.shiftData)
  const [votes, setVotes] = useState<VisitorVote[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!client)
  const [dataReady, setDataReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading")
  const [loadError, setLoadError] = useState("")
  const [lastUpdatedAt, setLastUpdatedAt] = useState("")
  const [resetVersion, setResetVersion] = useState(0)
  const [resetComplete, setResetComplete] = useState(false)
  const [loadVersion, setLoadVersion] = useState(0)
  const lastSyncedSnapshotRef = useRef("")

  const applySharedState = useCallback((state: SharedAppState) => {
    lastSyncedSnapshotRef.current = JSON.stringify(state)
    setMembers(state.members)
    setOrganizations(state.organizations)
    setProjects(state.projects)
    setShiftData(state.shiftData)
  }, [])

  useEffect(() => {
    if (!client) return
    let active = true

    client.auth.getUser().then(({ data, error }) => {
      if (!active) return
      setUser(error ? null : data.user)
      setAuthReady(true)
    })

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      if (!session?.user) setDataReady(false)
      setAuthReady(true)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])

  useEffect(() => {
    if (!client || !user) return

    let active = true
    queueMicrotask(() => {
      if (!active) return
      setDataReady(false)
      setSyncStatus("loading")
      setLoadError("")
    })

    const refreshVotes = async () => {
      const nextVotes = await fetchVisitorVotes(client)
      if (active) setVotes(nextVotes)
    }

    Promise.all([
      loadOrCreateSharedState(client, user),
      fetchVisitorVotes(client),
    ])
      .then(([row, nextVotes]) => {
        if (!active) return
        applySharedState(row.data)
        setVotes(nextVotes)
        setLastUpdatedAt(row.updated_at)
        setDataReady(true)
        setSyncStatus("realtime")
      })
      .catch((error: unknown) => {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : "Supabaseからデータを読み込めませんでした。")
        setSyncStatus("error")
      })

    const channel = client
      .channel(`event-ops-${sharedStateId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_ops_state",
          filter: `id=eq.${sharedStateId}`,
        },
        (payload) => {
          const nextRow = payload.new as {
            data?: unknown
            updated_at?: string
          }
          if (!active || !isSharedAppState(nextRow.data)) return
          applySharedState(nextRow.data)
          setLastUpdatedAt(nextRow.updated_at ?? "")
          setSyncStatus("realtime")
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitor_votes",
        },
        () => {
          refreshVotes().catch(() => setSyncStatus("error"))
        },
      )
      .subscribe((status) => {
        if (!active) return
        if (status === "SUBSCRIBED") setSyncStatus("realtime")
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSyncStatus("error")
      })

    return () => {
      active = false
      client.removeChannel(channel)
    }
  }, [applySharedState, client, loadVersion, user])

  const sharedState = useMemo<SharedAppState>(
    () => ({ members, organizations, projects, shiftData }),
    [members, organizations, projects, shiftData],
  )
  const sharedSnapshot = useMemo(() => JSON.stringify(sharedState), [sharedState])

  useEffect(() => {
    if (!client || !user || !dataReady) return
    if (sharedSnapshot === lastSyncedSnapshotRef.current) return

    let active = true
    queueMicrotask(() => {
      if (active) setSyncStatus("saving")
    })
    const timer = window.setTimeout(() => {
      saveSharedState(client, user, sharedState)
        .then((row) => {
          if (!active) return
          lastSyncedSnapshotRef.current = JSON.stringify(row.data)
          setLastUpdatedAt(row.updated_at)
          setSyncStatus("saved")
        })
        .catch(() => {
          if (active) setSyncStatus("error")
        })
    }, 350)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [client, dataReady, sharedSnapshot, sharedState, user])

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

  const resetSharedData = () => {
    if (!window.confirm("全ログインユーザーの共有データを初期状態へ戻しますか？")) return
    applySharedState(createInitialSharedState())
    lastSyncedSnapshotRef.current = ""
    setView("organizations")
    setResetVersion((prev) => prev + 1)
    setResetComplete(true)
    window.setTimeout(() => setResetComplete(false), 1800)
  }

  const logout = async () => {
    if (!client) return
    await client.auth.signOut()
  }

  if (!authReady || (user && !dataReady && !loadError)) {
    return (
      <main className="grid min-h-svh place-items-center bg-muted/35">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Cloud className="size-5 animate-pulse" />
          {authReady ? "共有データを読み込み中…" : "ログイン状態を確認中…"}
        </div>
      </main>
    )
  }

  if (!client || !isSupabaseConfigured || !user) {
    return <LoginScreen client={client} configured={isSupabaseConfigured} />
  }

  if (loadError) {
    return (
      <main className="grid min-h-svh place-items-center bg-muted/35 p-4">
        <section className="w-full max-w-lg rounded-2xl border bg-card p-6 text-center shadow-sm">
          <WifiOff className="mx-auto size-8 text-destructive" />
          <h1 className="mt-4 text-lg font-semibold">共有データへ接続できません</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{loadError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Supabaseでマイグレーションを実行し、Realtimeを有効にしてください。
          </p>
          <Button type="button" className="mt-5" onClick={() => setLoadVersion((prev) => prev + 1)}>
            再接続
          </Button>
        </section>
      </main>
    )
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
    return <ProjectVote projects={projects} votes={votes} />
  }

  const syncLabel = {
    loading: "読込中",
    realtime: "リアルタイム接続",
    saving: "保存中",
    saved: "保存済み",
    error: "同期エラー",
  }[syncStatus]

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

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Badge variant={syncStatus === "error" ? "destructive" : "outline"} className="hidden gap-1 lg:flex">
            {syncStatus === "error" ? <WifiOff className="size-3" /> : <Wifi className="size-3" />}
            {syncLabel}
          </Badge>
          <span className="hidden max-w-44 truncate text-xs text-muted-foreground xl:inline" title={user.email}>
            {resetComplete ? "初期化しました" : user.email}
          </span>
          {lastUpdatedAt ? (
            <span className="sr-only">最終更新: {lastUpdatedAt}</span>
          ) : null}
          <Button type="button" variant="outline" size="icon-sm" onClick={resetSharedData} aria-label="共有データを初期化">
            <RotateCcw className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={logout} aria-label="ログアウト">
            <LogOut className="size-4" />
          </Button>
        </div>
      </nav>
      <div className="min-h-0 flex-1">{renderView()}</div>
    </main>
  )
}
