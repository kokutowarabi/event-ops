"use client"

import { useMemo } from "react"
import { BarChart3, CalendarDays, Heart, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { EventDepartment, EventProject } from "@/lib/event-data"
import { eventSchedule, formatJapaneseDate } from "@/lib/event-schedule"
import type { VisitorVote } from "@/lib/supabase/votes"
import { projectVoteTotal, totalVotes, votesByDate } from "@/lib/votes"

export type VoteConnectionState = "unconfigured" | "connecting" | "realtime" | "error"

type ProjectVoteProps = {
  projects: EventProject[]
  votes: VisitorVote[]
  connectionState: VoteConnectionState
}

const departments: EventDepartment[] = ["模擬店", "屋外ステージ", "教室"]

export function ProjectVote({ projects, votes, connectionState }: ProjectVoteProps) {
  const stats = useMemo(() => {
    const ranking = [...projects].sort(
      (a, b) => projectVoteTotal(b.id, votes) - projectVoteTotal(a.id, votes),
    )
    const departmentTotals = departments.map((department) => ({
      department,
      count: projects
        .filter((project) => project.department === department)
        .reduce((total, project) => total + projectVoteTotal(project.id, votes), 0),
    }))

    return {
      ranking,
      departmentTotals,
      allVotes: totalVotes(votes),
      dailyTotals: votesByDate(votes),
    }
  }, [projects, votes])

  const connectionLabel = {
    unconfigured: "Supabase未設定",
    connecting: "接続中",
    realtime: "Realtime",
    error: "接続エラー",
  }[connectionState]

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-7xl flex-col px-3 py-4 md:px-4 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <BarChart3 className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">投票結果</h1>
        <Badge variant={connectionState === "error" ? "destructive" : "outline"} className="ml-2">
          {connectionLabel}
        </Badge>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">有効投票数</div>
            <div className="mt-2 text-3xl font-semibold">{stats.allVotes}</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">投票済み端末数</div>
            <div className="mt-2 flex items-center gap-2 text-3xl font-semibold">
              {stats.allVotes}
              <Heart className="size-6 text-rose-500" />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">掲載企画</div>
            <div className="mt-2 text-3xl font-semibold">{projects.length}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">投票日ごとの投票数</h2>
            </div>
            <div className="grid gap-2">
              {eventSchedule.festivalDays.map((day) => (
                <div key={day.date} className="flex items-center justify-between rounded-lg border bg-background p-3">
                  <span>{formatJapaneseDate(day.date, false)}</span>
                  <Badge variant="secondary">{stats.dailyTotals[day.date] ?? 0}票</Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">部門ごとの投票数</h2>
            </div>
            <div className="grid gap-2">
              {stats.departmentTotals.map((item) => (
                <div key={item.department} className="flex items-center justify-between rounded-lg border bg-background p-3">
                  <span>{item.department}</span>
                  <Badge variant="secondary">{item.count}票</Badge>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">企画別ランキング</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {stats.ranking.map((project, index) => (
              <div key={project.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{index + 1}. {project.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{project.department} / {project.organizationName}</div>
                </div>
                <Badge>{projectVoteTotal(project.id, votes)}票</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
