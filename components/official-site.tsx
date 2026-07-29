"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  ListChecks,
  MapPin,
  MonitorSmartphone,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EventDepartment, EventProject } from "@/lib/event-data"
import {
  eventSchedule,
  formatJapaneseDate,
  getSiteTimingStatus,
  parseDateTimeLocalValue,
  toDateTimeLocalValue,
  type SiteCmsContent,
  type SiteTimingPhase,
} from "@/lib/event-schedule"
import { siteConfig } from "@/lib/site-config"

type OfficialSiteProps = {
  projects: EventProject[]
  votedProjectIds: string[]
  onToggleVote: (projectId: string) => void
  siteCmsContent: SiteCmsContent
  onSiteCmsContentChange: (content: SiteCmsContent) => void
}

type OfficialPage = "home" | "projects" | "detail" | "votes"
type DepartmentFilter = EventDepartment | "すべて"

const departments: DepartmentFilter[] = ["すべて", "屋外ステージ", "教室", "模擬店"]

const cmsFields: Array<{
  key: keyof SiteCmsContent
  label: string
  multiline?: boolean
}> = [
  { key: "heroTitle", label: "トップ見出し" },
  { key: "heroDescription", label: "トップ説明", multiline: true },
  { key: "beforeFestivalLabel", label: "開催前の見出し" },
  { key: "beforeFestivalDescription", label: "開催前の説明", multiline: true },
  { key: "beforeOpenTitle", label: "当日・開始前の見出し" },
  { key: "beforeOpenDescription", label: "当日・開始前の説明", multiline: true },
  { key: "liveTitle", label: "開催中の見出し" },
  { key: "liveDescription", label: "開催中の説明", multiline: true },
  { key: "afterCloseTitle", label: "各日終了後の見出し" },
  { key: "afterCloseDescription", label: "各日終了後の説明", multiline: true },
  { key: "afterFestivalTitle", label: "全日程終了後の見出し" },
  { key: "afterFestivalDescription", label: "全日程終了後の説明", multiline: true },
]

const timingSamples: Array<{ label: string; value: string; phase: SiteTimingPhase }> = [
  { label: "本祭前", value: "2026-10-28T12:00", phase: "before-festival" },
  { label: "開始前", value: "2026-10-31T09:00", phase: "before-open" },
  { label: "開催中", value: "2026-10-31T12:00", phase: "live" },
  { label: "当日終了後", value: "2026-10-31T19:00", phase: "after-close" },
  { label: "本祭終了後", value: "2026-11-02T18:00", phase: "after-festival" },
]

const phaseLabels: Record<SiteTimingPhase, string> = {
  "before-festival": "本祭前",
  "before-open": "当日・開始前",
  live: "開催中",
  "after-close": "各日終了後",
  "after-festival": "全日程終了後",
}

export function OfficialSite({
  projects,
  votedProjectIds,
  onToggleVote,
  siteCmsContent,
  onSiteCmsContentChange,
}: OfficialSiteProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [page, setPage] = useState<OfficialPage>("home")
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState<DepartmentFilter>("すべて")
  const [simulatedDateTime, setSimulatedDateTime] = useState("2026-10-31T09:00")

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setSimulatedDateTime(toDateTimeLocalValue(new Date()))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedProject = projects.find((project) => project.id === selectedProjectId)
  const votedProjects = projects.filter((project) => votedProjectIds.includes(project.id))
  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesDepartment = department === "すべて" || project.department === department
      const matchesQuery =
        !normalizedQuery ||
        [project.title, project.organizationName, project.venue, project.note].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        )
      return matchesDepartment && matchesQuery
    })
  }, [department, projects, query])
  const timingStatus = useMemo(
    () => getSiteTimingStatus(parseDateTimeLocalValue(simulatedDateTime), siteCmsContent),
    [simulatedDateTime, siteCmsContent],
  )

  const updateCmsContent = (key: keyof SiteCmsContent, value: string) => {
    onSiteCmsContentChange({ ...siteCmsContent, [key]: value })
  }

  const navigate = (nextPage: OfficialPage) => {
    setPage(nextPage)
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    navigate("detail")
  }

  return (
    <div className="grid h-full min-h-0 bg-muted/30 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside className="max-h-[45svh] overflow-auto border-b bg-background p-4 lg:max-h-none lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2">
          <Settings2 className="size-5 text-muted-foreground" />
          <div>
            <h1 className="font-semibold">サイトCMS</h1>
            <p className="text-xs text-muted-foreground">テスト・文言編集専用</p>
          </div>
        </div>
        <p className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
          ここは別リポジトリの実サイトを公開する画面ではありません。表示タイミングと文言を確認するためのローカルプレビューです。
        </p>

        <section className="mt-5">
          <h2 className="text-sm font-semibold">表示日時をテスト</h2>
          <label className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
            プレビュー日時
            <Input
              type="datetime-local"
              value={simulatedDateTime}
              onChange={(event) => setSimulatedDateTime(event.target.value)}
              className="text-foreground"
            />
          </label>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Badge variant="outline">{phaseLabels[timingStatus.phase]}</Badge>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSimulatedDateTime(toDateTimeLocalValue(new Date()))}
            >
              <RotateCcw className="size-3.5" />
              現在時刻
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {timingSamples.map((sample) => (
              <Button
                key={sample.phase}
                type="button"
                size="sm"
                variant={timingStatus.phase === sample.phase ? "secondary" : "outline"}
                className="justify-start text-xs"
                onClick={() => setSimulatedDateTime(sample.value)}
              >
                {sample.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-5 border-t pt-5">
          <h2 className="text-sm font-semibold">運営日程</h2>
          <dl className="mt-2 grid gap-2 text-xs">
            <div className="rounded-lg bg-muted/50 p-2.5">
              <dt className="font-semibold">準備</dt>
              <dd className="mt-1 text-muted-foreground">
                {formatJapaneseDate(eventSchedule.preparationPeriod.startDate, false)}〜
                {formatJapaneseDate(eventSchedule.preparationPeriod.endDate, false)}
              </dd>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
              <dt className="font-semibold">本祭（サイト表示対象）</dt>
              {eventSchedule.festivalDays.map((day) => (
                <dd key={day.date} className="mt-1 text-muted-foreground">
                  {formatJapaneseDate(day.date, false)} {day.startTime}〜{day.endTime}
                </dd>
              ))}
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5">
              <dt className="font-semibold">片付け</dt>
              <dd className="mt-1 text-muted-foreground">
                {formatJapaneseDate(eventSchedule.cleanupPeriod.startDate, false)}〜
                {formatJapaneseDate(eventSchedule.cleanupPeriod.endDate, false)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-5 border-t pt-5">
          <h2 className="text-sm font-semibold">表示文言</h2>
          <div className="mt-3 grid gap-3">
            {cmsFields.map((field) => (
              <label key={field.key} className="grid gap-1.5 text-xs text-muted-foreground">
                {field.label}
                {field.multiline ? (
                  <textarea
                    value={siteCmsContent[field.key]}
                    onChange={(event) => updateCmsContent(field.key, event.target.value)}
                    rows={3}
                    className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                ) : (
                  <Input
                    value={siteCmsContent[field.key]}
                    onChange={(event) => updateCmsContent(field.key, event.target.value)}
                    className="text-foreground"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      </aside>

      <section className="flex min-h-0 flex-col p-3 md:p-4">
        <div className="mb-2 flex shrink-0 items-center gap-2">
          <MonitorSmartphone className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">公開サイトのプレビュー</span>
          <Badge variant="secondary" className="ml-auto">公開されません</Badge>
        </div>
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-auto rounded-xl border bg-[#f5f2e9] text-[#18231f] shadow-sm"
        >
      <header className="sticky top-0 z-30 border-b border-[#18231f]/10 bg-[#f5f2e9]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button type="button" onClick={() => navigate("home")} className="text-left">
            <div className="text-xs font-semibold tracking-[0.22em] text-[#c45235]">{siteConfig.universityNameEn}</div>
            <div className="text-lg font-black tracking-tight">{siteConfig.festivalName}</div>
          </button>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="公式サイト内ナビゲーション">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("home")}>
              ホーム
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("projects")}>
              企画を探す
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("votes")}>
              <ListChecks className="size-4" />
              マイ投票
              <Badge className="ml-1 bg-[#18231f] text-white">{votedProjectIds.length}</Badge>
            </Button>
          </nav>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto md:hidden"
            onClick={() => navigate("votes")}
            aria-label="マイ投票を表示"
          >
            <Heart className="size-4" />
            {votedProjectIds.length}
          </Button>
        </div>
      </header>

      {page === "home" ? (
        <>
          <section className="relative min-h-[70svh] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,#f3bf44_0_11%,transparent_11.5%),radial-gradient(circle_at_82%_16%,#5ab7b2_0_13%,transparent_13.5%),linear-gradient(135deg,#fff9e9,#e8f3ed_52%,#f7e8df)]" />
            <div className="relative mx-auto flex min-h-[70svh] max-w-6xl flex-col justify-center gap-10 px-4 py-16 md:flex-row md:items-end md:justify-between md:py-24">
              <div className="max-w-2xl">
                <Badge className="mb-4 bg-[#c45235] text-white">{siteConfig.festivalEdition}</Badge>
                <div className="mb-6 max-w-xl rounded-2xl border border-[#18231f]/10 bg-white/85 p-5 shadow-sm">
                  <div className="text-xs font-bold tracking-[0.18em] text-[#c45235]">
                    {phaseLabels[timingStatus.phase]}
                  </div>
                  <div className="mt-2 text-3xl font-black leading-tight">{timingStatus.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[#18231f]/65">{timingStatus.description}</p>
                  {timingStatus.countdownLabel && timingStatus.countdown ? (
                    <div className="mt-4 flex items-baseline gap-2 border-t border-[#18231f]/10 pt-3">
                      <span className="text-xs font-bold text-[#18231f]/55">{timingStatus.countdownLabel}</span>
                      <span className="text-xl font-black text-[#c45235]">{timingStatus.countdown}</span>
                    </div>
                  ) : null}
                </div>
                <h1 className="text-5xl font-black leading-[1.08] tracking-[-0.04em] md:text-7xl">
                  {siteCmsContent.heroTitle}
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 md:text-lg">
                  {siteCmsContent.heroDescription}
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  <Button type="button" className="bg-[#18231f] text-white hover:bg-[#18231f]/90" onClick={() => navigate("projects")}>
                    <Search className="size-4" />
                    企画を探す
                  </Button>
                  <Button type="button" variant="outline" className="bg-white/70" onClick={() => navigate("votes")}>
                    <Heart className="size-4" />
                    マイ投票を見る
                  </Button>
                </div>
              </div>

              <div className="grid w-full max-w-sm gap-4 rounded-2xl border border-[#18231f]/10 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <CalendarDays className="size-4 text-[#c45235]" />
                  開催情報
                </div>
                <div className="grid gap-3">
                  {eventSchedule.festivalDays.map((day) => (
                    <div key={day.date} className="border-b border-[#18231f]/10 pb-3 last:border-0 last:pb-0">
                      <div className="font-black">{formatJapaneseDate(day.date, false)}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-[#18231f]/65">
                        <Clock3 className="size-4 text-[#c45235]" />
                        {day.startTime}〜{day.endTime}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t border-[#18231f]/10 pt-3 text-sm">
                  <MapPin className="size-4 text-[#c45235]" />
                  {siteConfig.campusName}
                </div>
              </div>
            </div>
          </section>

          <main className="mx-auto grid max-w-6xl gap-12 px-4 py-12">
            <section>
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-bold tracking-[0.18em] text-[#c45235]">PROGRAMS</div>
                  <h2 className="mt-1 text-3xl font-black">注目の企画</h2>
                </div>
                <Button type="button" variant="ghost" onClick={() => navigate("projects")}>
                  すべて見る
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {projects.slice(0, 3).map((project, index) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => openProject(project.id)}
                    className="group min-h-64 rounded-2xl border border-[#18231f]/10 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <Badge variant="outline">{project.department}</Badge>
                      <span className="text-4xl font-black text-[#18231f]/10">0{index + 1}</span>
                    </div>
                    <h3 className="mt-8 text-2xl font-black leading-tight">{project.title}</h3>
                    <p className="mt-2 text-sm text-[#18231f]/60">{project.organizationName}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#c45235]">
                      詳細を見る
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-4 rounded-3xl bg-[#18231f] p-6 text-white md:grid-cols-[1fr_auto] md:items-center md:p-10">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#f3bf44]">
                  <Sparkles className="size-4" />
                  YOUR FESTIVAL PICKS
                </div>
                <h2 className="mt-3 text-3xl font-black">気になる企画に投票しよう</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                  各企画の詳細ページから投票できます。投票した企画は、この端末の「マイ投票」に保存されます。
                </p>
              </div>
              <Button type="button" className="bg-[#f3bf44] text-[#18231f] hover:bg-[#f3bf44]/90" onClick={() => navigate("projects")}>
                企画を選ぶ
              </Button>
            </section>
          </main>
        </>
      ) : null}

      {page === "projects" ? (
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="max-w-2xl">
            <div className="text-xs font-bold tracking-[0.18em] text-[#c45235]">PROGRAM SEARCH</div>
            <h1 className="mt-2 text-4xl font-black">企画を探す</h1>
            <p className="mt-3 leading-7 text-[#18231f]/65">気になる企画を開いて、応援したい企画に投票できます。</p>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-[#18231f]/10 bg-white p-4 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#18231f]/40" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="企画名・参加団体名・会場から検索"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={department === item ? "default" : "outline"}
                  onClick={() => setDepartment(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visibleProjects.map((project) => {
              const voted = votedProjectIds.includes(project.id)
              return (
                <article key={project.id} className="rounded-2xl border border-[#18231f]/10 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="outline">{project.department}</Badge>
                    {voted ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-[#c45235]">
                        <Check className="size-3.5" />
                        投票済み
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-5 text-2xl font-black">{project.title}</h2>
                  <p className="mt-2 text-sm text-[#18231f]/55">{project.organizationName}</p>
                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-[#18231f]/70">{project.note}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4 text-[#c45235]" />
                      {project.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-4 text-[#c45235]" />
                      {project.startTime}-{project.endTime}
                    </span>
                  </div>
                  <Button type="button" className="mt-6 w-full" onClick={() => openProject(project.id)}>
                    詳細ページを見る
                    <ArrowRight className="size-4" />
                  </Button>
                </article>
              )
            })}
          </div>

          {visibleProjects.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-[#18231f]/60">
              条件に合う企画がありません。
            </div>
          ) : null}
        </main>
      ) : null}

      {page === "detail" && selectedProject ? (
        <main className="mx-auto max-w-5xl px-4 py-10">
          <Button type="button" variant="ghost" onClick={() => navigate("projects")}>
            <ArrowLeft className="size-4" />
            企画一覧へ戻る
          </Button>
          <div className="mt-4 overflow-hidden rounded-3xl border border-[#18231f]/10 bg-white">
            <div className="relative min-h-56 bg-[radial-gradient(circle_at_76%_25%,#5ab7b2_0_16%,transparent_16.5%),radial-gradient(circle_at_22%_70%,#f3bf44_0_14%,transparent_14.5%),linear-gradient(135deg,#f7e8df,#e8f3ed)] p-7 md:p-10">
              <Badge className="bg-[#c45235] text-white">{selectedProject.department}</Badge>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{selectedProject.title}</h1>
              <p className="mt-4 font-semibold">{selectedProject.organizationName}</p>
            </div>
            <div className="grid gap-8 p-6 md:grid-cols-[1fr_19rem] md:p-10">
              <div>
                <h2 className="text-xl font-black">企画について</h2>
                <p className="mt-4 text-base leading-8 text-[#18231f]/75">{selectedProject.note}</p>
                <dl className="mt-8 grid gap-4 rounded-2xl bg-[#f5f2e9] p-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold text-[#18231f]/45">会場</dt>
                    <dd className="mt-1 font-semibold">{selectedProject.venue}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-[#18231f]/45">開催時間</dt>
                    <dd className="mt-1 font-semibold">{selectedProject.startTime}-{selectedProject.endTime}</dd>
                  </div>
                </dl>
              </div>
              <aside className="rounded-2xl border border-[#18231f]/10 p-5">
                <Heart className="size-7 text-[#c45235]" />
                <h2 className="mt-4 text-xl font-black">この企画を応援</h2>
                <p className="mt-2 text-sm leading-6 text-[#18231f]/60">
                  投票はこの端末に保存され、マイ投票からいつでも確認できます。
                </p>
                <Button
                  type="button"
                  className="mt-5 w-full bg-[#c45235] text-white hover:bg-[#c45235]/90"
                  onClick={() => onToggleVote(selectedProject.id)}
                >
                  {votedProjectIds.includes(selectedProject.id) ? (
                    <>
                      <Check className="size-4" />
                      投票済み（取り消す）
                    </>
                  ) : (
                    <>
                      <Heart className="size-4" />
                      この企画に投票する
                    </>
                  )}
                </Button>
              </aside>
            </div>
          </div>
        </main>
      ) : null}

      {page === "votes" ? (
        <main className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold tracking-[0.18em] text-[#c45235]">MY VOTES</div>
              <h1 className="mt-2 text-4xl font-black">マイ投票</h1>
              <p className="mt-3 text-[#18231f]/65">この端末から投票した企画をまとめています。</p>
            </div>
            <Button type="button" variant="outline" onClick={() => navigate("projects")}>
              企画を追加する
            </Button>
          </div>

          {votedProjects.length > 0 ? (
            <div className="mt-8 grid gap-4">
              {votedProjects.map((project) => (
                <article key={project.id} className="flex flex-col gap-4 rounded-2xl border border-[#18231f]/10 bg-white p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline">{project.department}</Badge>
                    <h2 className="mt-3 text-xl font-black">{project.title}</h2>
                    <p className="mt-1 text-sm text-[#18231f]/55">{project.organizationName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => openProject(project.id)}>
                      詳細
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => onToggleVote(project.id)}>
                      取り消す
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-[#18231f]/20 bg-white/55 p-12 text-center">
              <Heart className="mx-auto size-10 text-[#c45235]" />
              <h2 className="mt-4 text-xl font-black">まだ投票した企画はありません</h2>
              <p className="mt-2 text-sm text-[#18231f]/60">企画詳細ページから、気になる企画に投票してみてください。</p>
              <Button type="button" className="mt-6" onClick={() => navigate("projects")}>
                企画を探す
              </Button>
            </div>
          )}
        </main>
      ) : null}
        </div>
      </section>
    </div>
  )
}
