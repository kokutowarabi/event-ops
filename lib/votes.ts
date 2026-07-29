import type { VisitorVote } from "@/lib/supabase/data"

export function projectVoteTotal(projectId: string, votes: VisitorVote[]) {
  return votes.filter((vote) => vote.project_id === projectId).length
}

export function totalVotes(votes: VisitorVote[]) {
  return votes.length
}

export function voteDateKey(timestamp: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function votesByDate(votes: VisitorVote[]) {
  return votes.reduce<Record<string, number>>((counts, vote) => {
    const date = voteDateKey(vote.created_at)
    counts[date] = (counts[date] ?? 0) + 1
    return counts
  }, {})
}
