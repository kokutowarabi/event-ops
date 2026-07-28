export const baseVoteCounts: Record<string, number> = {
  "project-1": 86,
  "project-2": 128,
  "project-3": 104,
  "project-4": 72,
  "project-5": 97,
}

export const dailyVoteCounts = [
  { date: "10/31", count: 142 },
  { date: "11/1", count: 188 },
  { date: "11/2", count: 157 },
] as const

export function projectVoteTotal(projectId: string, votedProjectIds: string[]) {
  return (baseVoteCounts[projectId] ?? 0) + (votedProjectIds.includes(projectId) ? 1 : 0)
}

export function totalVotes(projectIds: string[], votedProjectIds: string[]) {
  return projectIds.reduce((total, projectId) => total + projectVoteTotal(projectId, votedProjectIds), 0)
}
