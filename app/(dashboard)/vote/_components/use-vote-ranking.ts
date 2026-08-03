import { useMemo, useState } from "react"
import { downloadCsv } from "@/lib/csv"
import { eventDepartments, type EventDepartment, type EventProject } from "@/lib/event-data"
import { formatJapaneseDate } from "@/lib/event-schedule"
import type { VisitorVote } from "@/lib/supabase/votes"
import {
  projectVoteTotal,
  totalVotes,
  votesByDate,
  votesOnDate,
} from "@/lib/votes"

export const voteDepartments = eventDepartments
export const ALL_VOTE_DATES = "all"
export const ALL_VOTE_DEPARTMENTS = "all"

export function useVoteRanking(projects: EventProject[], votes: VisitorVote[]) {
  const [selectedVoteDate, setSelectedVoteDate] = useState(ALL_VOTE_DATES)
  const [selectedDepartment, setSelectedDepartment] = useState<
    EventDepartment | typeof ALL_VOTE_DEPARTMENTS
  >(ALL_VOTE_DEPARTMENTS)

  const stats = useMemo(() => {
    const departmentTotals = voteDepartments.map((department) => ({
      department,
      count: projects
        .filter((project) => project.department === department)
        .reduce(
          (total, project) => total + projectVoteTotal(project.id, votes),
          0,
        ),
    }))
    return {
      departmentTotals,
      allVotes: totalVotes(votes),
      dailyTotals: votesByDate(votes),
    }
  }, [projects, votes])

  const rankingStats = useMemo(() => {
    const rankingVotes =
      selectedVoteDate === ALL_VOTE_DATES
        ? votes
        : votesOnDate(votes, selectedVoteDate)
    const rankingProjects =
      selectedDepartment === ALL_VOTE_DEPARTMENTS
        ? projects
        : projects.filter(
            (project) => project.department === selectedDepartment,
          )
    const ranking = [...rankingProjects].sort((left, right) => {
      const voteDifference =
        projectVoteTotal(right.id, rankingVotes)
        - projectVoteTotal(left.id, rankingVotes)
      return voteDifference || left.title.localeCompare(right.title, "ja")
    })
    return { ranking, votes: rankingVotes }
  }, [projects, selectedDepartment, selectedVoteDate, votes])

  const exportRanking = () => {
    const voteDateLabel =
      selectedVoteDate === ALL_VOTE_DATES
        ? "全投票日"
        : formatJapaneseDate(selectedVoteDate, false)
    downloadCsv(
      `投票結果_${
        selectedVoteDate === ALL_VOTE_DATES ? "全投票日" : selectedVoteDate
      }_${
        selectedDepartment === ALL_VOTE_DEPARTMENTS
          ? "全部門"
          : selectedDepartment
      }`,
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

  return {
    selectedVoteDate,
    selectedDepartment,
    stats,
    rankingStats,
    setSelectedVoteDate,
    setSelectedDepartment,
    exportRanking,
  }
}
