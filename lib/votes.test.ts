import { describe, expect, it } from "vitest"
import type { VisitorVote } from "@/lib/supabase/data"
import { projectVoteTotal, totalVotes, votesByDate } from "@/lib/votes"

const votes: VisitorVote[] = [
  {
    device_id: "00000000-0000-0000-0000-000000000001",
    project_id: "project-1",
    created_at: "2026-10-31T01:00:00.000Z",
    updated_at: "2026-10-31T01:00:00.000Z",
  },
  {
    device_id: "00000000-0000-0000-0000-000000000002",
    project_id: "project-2",
    created_at: "2026-11-01T01:00:00.000Z",
    updated_at: "2026-11-01T01:00:00.000Z",
  },
]

describe("Supabase vote totals", () => {
  it("counts only persisted votes for a project", () => {
    expect(projectVoteTotal("project-1", votes)).toBe(1)
    expect(projectVoteTotal("project-3", votes)).toBe(0)
  })

  it("counts one row per voting device", () => {
    expect(totalVotes(votes)).toBe(2)
  })

  it("groups timestamps by festival date in Japan", () => {
    expect(votesByDate(votes)).toEqual({
      "2026-10-31": 1,
      "2026-11-01": 1,
    })
  })
})
