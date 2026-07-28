"use client"

import { useMemo } from "react"
import { BarChart3, CalendarDays, Heart, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { EventDepartment, EventProject } from "@/lib/event-data"
import { dailyVoteCounts, projectVoteTotal, totalVotes } from "@/lib/votes"

type ProjectVoteProps = {
  projects: EventProject[]
  votedProjectIds: string[]
}

const departments: EventDepartment[] = ["模擬店", "屋外ステージ", "教室"]

export function ProjectVote({ projects, votedProjectIds }: ProjectVoteProps) {
  const stats = useMemo(() => {
    const ranking = [...projects].sort(
      (a, b) => projectVoteTotal(b.id, votedProjectIds) - projectVoteTotal(a.id, votedProjectIds),
    )
    const departmentTotals = departments.map((department) => ({
      department,
      count: projects
        .filter((project) => project.department === department)
        .reduce((total, project) => total + projectVoteTotal(project.id, votedProjectIds), 0),
    }))

    return {
      ranking,
      departmentTotals,
      allVotes: totalVotes(projects.map((project) => project.id), votedProjectIds),
    }
  }, [projects, votedProjectIds])

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-3 py-4 md:px-4 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <BarChart3 className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">投票結果</h1>
        <Badge variant="outline" className="ml-2">来場者投票デモ</Badge>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">累計投票数</div>
            <div className="mt-2 text-3xl font-semibold">{stats.allVotes}</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">この端末からの投票</div>
            <div className="mt-2 flex items-center gap-2 text-3xl font-semibold">
              {votedProjectIds.length}
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
              <h2 className="font-semibold">開催日ごとの投票数</h2>
            </div>
            <div className="grid gap-2">
              {dailyVoteCounts.map((item) => (
                <div key={item.date} className="flex items-center justify-between rounded-lg border bg-background p-3">
                  <span>{item.date}</span>
                  <Badge variant="secondary">{item.count}票</Badge>
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
                  <div className="truncate font-medium">
                    {index + 1}. {project.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {project.department} / {project.organizationName}
                  </div>
                </div>
                <Badge>{projectVoteTotal(project.id, votedProjectIds)}票</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
