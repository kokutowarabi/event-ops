import type { VisitorVote } from "@/lib/supabase/votes"

export function projectVoteTotal(projectId: string, votes: VisitorVote[]) {
  return votes.filter((vote) => vote.project_id === projectId).length
}

export function totalVotes(votes: VisitorVote[]) {
  return votes.length
}

export function votesByDate(votes: VisitorVote[]) {
  return votes.reduce<Record<string, number>>((counts, vote) => {
    counts[vote.voted_on] = (counts[vote.voted_on] ?? 0) + 1
    return counts
  }, {})
}

export function votesOnDate(votes: VisitorVote[], votedOn: string) {
  return votes.filter((vote) => vote.voted_on === votedOn)
}
