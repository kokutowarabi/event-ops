import { useMemo, useState } from "react"
import { BarChart3, CalendarDays, Download, Heart, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VoteDataSkeleton } from "@/components/dashboard/vote-data-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { downloadCsv } from "@/lib/csv"
import type { EventDepartment, EventProject } from "@/lib/event-data"
import { eventSchedule, formatJapaneseDate } from "@/lib/event-schedule"
import type { VisitorVote } from "@/lib/supabase/votes"
import {
  projectVoteTotal,
  totalVotes,
  votesByDate,
  votesOnDate,
  votingDeviceCount,
} from "@/lib/votes"

export type VoteConnectionState = "unconfigured" | "connecting" | "realtime" | "error"

type ProjectVoteProps = {
  projects: EventProject[]
  votes: VisitorVote[]
  connectionState: VoteConnectionState
  loading?: boolean
}

const departments: EventDepartment[] = ["模擬店", "屋外ステージ", "教室"]
const allVoteDates = "all"
const allDepartments = "all"

export function ProjectVote({
  projects,
  votes,
  connectionState,
  loading = false,
}: ProjectVoteProps) {
  const [selectedVoteDate, setSelectedVoteDate] = useState(allVoteDates)
  const [selectedDepartment, setSelectedDepartment] = useState<
    EventDepartment | typeof allDepartments
  >(allDepartments)

  const stats = useMemo(() => {
    const departmentTotals = departments.map((department) => ({
      department,
      count: projects
        .filter((project) => project.department === department)
        .reduce((total, project) => total + projectVoteTotal(project.id, votes), 0),
    }))

    return {
      departmentTotals,
      allVotes: totalVotes(votes),
      votingDevices: votingDeviceCount(votes),
      dailyTotals: votesByDate(votes),
    }
  }, [projects, votes])

  const rankingStats = useMemo(() => {
    const rankingVotes = selectedVoteDate === allVoteDates
      ? votes
      : votesOnDate(votes, selectedVoteDate)
    const rankingProjects = selectedDepartment === allDepartments
      ? projects
      : projects.filter((project) => project.department === selectedDepartment)
    const ranking = [...rankingProjects].sort((a, b) => {
      const voteDifference = projectVoteTotal(b.id, rankingVotes)
        - projectVoteTotal(a.id, rankingVotes)
      return voteDifference || a.title.localeCompare(b.title, "ja")
    })

    return {
      ranking,
      votes: rankingVotes,
    }
  }, [projects, selectedDepartment, selectedVoteDate, votes])

  const connectionLabel = {
    unconfigured: "Supabase未設定",
    connecting: "接続中",
    realtime: "Realtime",
    error: "接続エラー",
  }[connectionState]

  const exportRanking = () => {
    const voteDateLabel = selectedVoteDate === allVoteDates
      ? "全投票日"
      : formatJapaneseDate(selectedVoteDate, false)
    downloadCsv(
      `投票結果_${selectedVoteDate === allVoteDates ? "全投票日" : selectedVoteDate}_${selectedDepartment === allDepartments ? "全部門" : selectedDepartment}`,
      ["順位", "投票日", "部門", "企画名", "参加団体", "票数"],
      rankingStats.ranking.map((project, index) => [
        index + 1,
        voteDateLabel,
        project.department,
        project.title,
        project.organizationName,
        projectVoteTotal(project.id, rankingStats.votes),
      ]),
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-7xl flex-col px-3 py-4 md:px-4 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <BarChart3 className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">投票結果</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportRanking}
          disabled={loading || rankingStats.ranking.length === 0}
          title="選択中の日付・部門ランキングをCSV出力"
        >
          <Download className="size-4" />
          CSV
        </Button>
        <Badge variant={connectionState === "error" ? "destructive" : "outline"} className="ml-2">
          {connectionLabel}
        </Badge>
      </header>

      {loading ? (
        <VoteDataSkeleton />
      ) : (
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">有効投票数</div>
            <div className="mt-2 text-3xl font-semibold">{stats.allVotes}</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">投票参加端末数</div>
            <div className="mt-2 flex items-center gap-2 text-3xl font-semibold">
              {stats.votingDevices}
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
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-muted-foreground" />
                <h2 className="font-semibold">投票日・部門別ランキング</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                選択した投票日の票だけで、部門内の順位を表示します。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="grid gap-1 text-xs text-muted-foreground">
                投票日
                <Select
                  value={selectedVoteDate}
                  onValueChange={(value) => value !== null && setSelectedVoteDate(value)}
                >
                  <SelectTrigger className="min-w-44 bg-background">
                    <SelectValue>
                      {selectedVoteDate === allVoteDates
                        ? "全投票日"
                        : `${formatJapaneseDate(selectedVoteDate, false)}・${
                            eventSchedule.festivalDays.find(
                              (day) => day.date === selectedVoteDate,
                            )?.label ?? ""
                          }`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={allVoteDates}>全投票日</SelectItem>
                    {eventSchedule.festivalDays.map((day) => (
                      <SelectItem key={day.date} value={day.date}>
                        {formatJapaneseDate(day.date, false)}・{day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                部門
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setSelectedDepartment(value as EventDepartment | typeof allDepartments)
                    }
                  }}
                >
                  <SelectTrigger className="min-w-36 bg-background">
                    <SelectValue>
                      {selectedDepartment === allDepartments
                        ? "全部門"
                        : selectedDepartment}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={allDepartments}>全部門</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {rankingStats.ranking.map((project, index) => (
              <div key={project.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{index + 1}. {project.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{project.department} / {project.organizationName}</div>
                </div>
                <Badge>{projectVoteTotal(project.id, rankingStats.votes)}票</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
      )}
    </div>
  )
}
