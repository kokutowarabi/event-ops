"use client"

import { useMemo } from "react"
import { BarChart3, CalendarDays, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { EventDepartment, EventProject } from "@/lib/event-data"

type ProjectVoteProps = {
  projects: EventProject[]
}

const eventStartDate = "2026-06-26"
const voteHistory: Record<string, Record<string, number>> = {
  "project-1": { "2026-06-26": 18, "2026-06-27": 24, "2026-06-28": 16 },
  "project-2": { "2026-06-26": 34, "2026-06-27": 52, "2026-06-28": 27 },
  "project-3": { "2026-06-26": 28, "2026-06-27": 36, "2026-06-28": 22 },
  "project-4": { "2026-06-26": 21, "2026-06-27": 37, "2026-06-28": 18 },
  "project-5": { "2026-06-26": 12, "2026-06-27": 19, "2026-06-28": 11 },
}

const departments: EventDepartment[] = ["模擬店", "屋外ステージ", "教室"]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function projectTotal(projectId: string) {
  return Object.values(voteHistory[projectId] ?? {}).reduce((total, count) => total + count, 0)
}

export function ProjectVote({ projects }: ProjectVoteProps) {
  const today = todayKey()
  const stats = useMemo(() => {
    const todayVotes = projects.reduce((total, project) => total + (voteHistory[project.id]?.[today] ?? 0), 0)
    const allVotes = projects.reduce((total, project) => total + projectTotal(project.id), 0)
    const sinceStartVotes = projects.reduce((total, project) => {
      return total + Object.entries(voteHistory[project.id] ?? {})
        .filter(([date]) => date >= eventStartDate && date <= today)
        .reduce((sum, [, count]) => sum + count, 0)
    }, 0)
    const dateTotals = Array.from(
      new Set(projects.flatMap((project) => Object.keys(voteHistory[project.id] ?? {}))),
    )
      .sort()
      .map((date) => ({
        date,
        count: projects.reduce((total, project) => total + (voteHistory[project.id]?.[date] ?? 0), 0),
      }))
    const departmentTotals = departments.map((department) => ({
      department,
      count: projects
        .filter((project) => project.department === department)
        .reduce((total, project) => total + projectTotal(project.id), 0),
    }))
    const ranking = [...projects].sort((a, b) => projectTotal(b.id) - projectTotal(a.id))
    return { todayVotes, allVotes, sinceStartVotes, dateTotals, departmentTotals, ranking }
  }, [projects, today])

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-3 py-4 md:px-4 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <BarChart3 className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">投票管理</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">現在の投票数</div>
            <div className="mt-2 text-3xl font-semibold">{stats.todayVotes}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">全日程の投票数</div>
            <div className="mt-2 text-3xl font-semibold">{stats.allVotes}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">開始日から今日まで</div>
            <div className="mt-2 text-3xl font-semibold">{stats.sinceStartVotes}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-lg border bg-card p-3">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">日にちごとの投票数</h2>
            </div>
            <div className="grid gap-2">
              {stats.dateTotals.map((item) => (
                <div key={item.date} className="flex items-center justify-between rounded-md border bg-background p-3">
                  <span>{item.date}</span>
                  <Badge variant="secondary">{item.count}票</Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-3">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">部門ごとの投票数</h2>
            </div>
            <div className="grid gap-2">
              {stats.departmentTotals.map((item) => (
                <div key={item.department} className="flex items-center justify-between rounded-md border bg-background p-3">
                  <span>{item.department}</span>
                  <Badge variant="secondary">{item.count}票</Badge>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-lg border bg-card p-3">
          <h2 className="mb-3 font-semibold">企画別ランキング</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {stats.ranking.map((project, index) => (
              <div key={project.id} className="flex items-center justify-between rounded-md border bg-background p-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {index + 1}. {project.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{project.department} / {project.organizationName}</div>
                </div>
                <Badge>{projectTotal(project.id)}票</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
