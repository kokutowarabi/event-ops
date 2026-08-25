import { useMemo, useState } from "react"
import {
  Check,
  Clock3,
  Heart,
  Home,
  Search,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EventProject } from "@/lib/event-data"
import { eventSchedule, formatJapaneseDate } from "@/lib/event-schedule"
import { siteConfig } from "@/lib/site-config"
import { getSitePreviewStatus } from "@/lib/site-preview"
import { PreviewControlDock } from "./preview-control-dock"
import { usePreviewVoting } from "./use-preview-voting"

const initialPreviewDateTime = `${eventSchedule.festivalDays[0].date}T12:00`

function currentLocalDateTime() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}


type SitePreviewProps = {
  projects: EventProject[]
  votingConfigured: boolean
  onVote: (
    deviceId: string,
    projectId: string,
    votedOn: string,
  ) => Promise<boolean>
}

export function SitePreview({
  projects,
  votingConfigured,
  onVote,
}: SitePreviewProps) {
  const [previewDateTime, setPreviewDateTime] = useState(initialPreviewDateTime)
  const [page, setPage] = useState<"home" | "projects">("home")
  const [query, setQuery] = useState("")
  const status = getSitePreviewStatus(previewDateTime)
  const { submittingProjectId, message, vote, isVoted } = usePreviewVoting({
    votingOpen: status.votingOpen,
    voteDate: status.voteDate,
    votingConfigured,
    onVote,
  })

  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ja")
    if (!normalized) return projects
    return projects.filter((project) =>
      [
        project.title,
        project.organizationName,
        project.department,
        project.venue,
      ].some((value) => value.toLocaleLowerCase("ja").includes(normalized)),
    )
  }, [projects, query])

  return (
    <div className="relative h-svh overflow-hidden bg-[#f7f4ed]">
      <div className="h-full overflow-auto">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-900/10 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="mr-auto">
            <div className="text-[10px] font-black tracking-[0.2em] text-cyan-700">{siteConfig.universityNameEn}</div>
            <div className="font-black text-slate-900">{siteConfig.festivalEdition}</div>
          </div>
          <Button type="button" size="sm" variant={page === "home" ? "default" : "ghost"} onClick={() => setPage("home")}>
            <Home className="size-4" data-icon-motion="bounce" />
            トップ
          </Button>
          <Button type="button" size="sm" variant={page === "projects" ? "default" : "ghost"} onClick={() => setPage("projects")}>
            <Sparkles className="size-4" data-icon-motion="spin" />
            企画
          </Button>
        </div>

        {page === "home" ? (
          <div className="grid min-h-full place-items-center bg-[radial-gradient(circle_at_top_left,#cffafe,transparent_45%),radial-gradient(circle_at_bottom_right,#fef3c7,transparent_45%)] px-5 py-16 text-center">
            <section className="max-w-3xl">
              <Badge className="mb-5 bg-cyan-700 text-white hover:bg-cyan-700">{siteConfig.campusName}</Badge>
              <p className="text-sm font-bold tracking-[0.28em] text-cyan-800">{siteConfig.universityName}</p>
              <h2 className="mt-3 text-5xl font-black tracking-tight text-slate-950 md:text-7xl">{siteConfig.festivalName}</h2>
              <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-cyan-950/10">
                <div className="flex items-center justify-center gap-2 text-cyan-800">
                  <Clock3 className="size-5" data-icon-motion="bounce" />
                  <span className="text-sm font-bold">{previewDateTime.replace("T", " ")}</span>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-950">{status.headline}</p>
                <p className="mt-2 text-sm text-slate-600">{status.detail}</p>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {eventSchedule.festivalDays.map((day) => (
                  <span key={day.date} className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    {formatJapaneseDate(day.date, false)} {day.startTime}〜{day.endTime}
                  </span>
                ))}
              </div>
              <Button type="button" size="lg" className="mt-9" onClick={() => setPage("projects")}>
                企画を見て投票する
                <Heart className="size-4" data-icon-motion="pulse" />
              </Button>
            </section>
          </div>
        ) : (
          <div className="px-4 py-7 md:px-8">
            <div className="flex flex-wrap items-end gap-3">
              <div className="mr-auto">
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-700">PROJECTS</p>
                <h2 className="mt-1 text-3xl font-black text-slate-950">企画一覧・投票</h2>
                <p className="mt-1 text-sm text-slate-600">{status.headline} — {status.detail}</p>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" data-icon-motion="slide-right" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="企画・団体・会場を検索" className="w-64 bg-white pl-9" />
              </label>
            </div>

            {!votingConfigured ? (
              <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Supabase未設定のため投票ボタンは無効です。
              </p>
            ) : null}
            {message ? (
              <p className="mt-4 rounded-lg border bg-white p-3 text-sm text-slate-700" role="status">{message}</p>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => {
                const voted = isVoted(project.id)
                const voteEligible = /^project-(?:[1-9]|[1-3]\d|40)$/.test(project.id)
                return (
                  <article key={project.id} className="flex flex-col rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{project.department}</Badge>
                      <Badge variant="outline">{project.status}</Badge>
                      <span className="text-xs text-slate-500">{project.startTime}〜{project.endTime}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-950">{project.title}</h3>
                    <p className="mt-1 text-sm font-medium text-cyan-800">{project.organizationName}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {project.note || "企画紹介は準備中です。"}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p>会場: {project.venue || "未定"}</p>
                      <p>担当: {project.owner || "未定"}</p>
                    </div>
                    <Button
                      type="button"
                      className="mt-5 w-full"
                      variant={voted ? "outline" : "default"}
                      disabled={voted || !status.votingOpen || !votingConfigured || !voteEligible || Boolean(submittingProjectId)}
                      onClick={() => vote(project)}
                    >
                      {voted ? <Check className="size-4" data-icon-motion="pop" /> : <Heart className="size-4" data-icon-motion="pulse" />}
                      {voted
                        ? "投票済み"
                        : submittingProjectId === project.id
                          ? "送信中…"
                          : !voteEligible
                            ? "投票対象外"
                            : status.votingOpen
                            ? "この企画に投票"
                            : "投票受付時間外"}
                    </Button>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <PreviewControlDock
        previewDateTime={previewDateTime}
        onPreviewDateTimeChange={setPreviewDateTime}
        onUseCurrentDateTime={() => setPreviewDateTime(currentLocalDateTime())}
      />
    </div>
  )
}
