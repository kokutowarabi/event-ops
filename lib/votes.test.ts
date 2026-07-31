import { describe, expect, it } from "vitest"
import type { VisitorVote } from "@/lib/supabase/votes"
import {
  appendVisitorVote,
  projectVoteTotal,
  totalVotes,
  votesByDate,
  votesOnDate,
  votingDeviceCount,
} from "@/lib/votes"

const votes: VisitorVote[] = [
  {
    device_id: "00000000-0000-0000-0000-000000000001",
    project_id: "project-1",
    voted_on: "2026-10-31",
    created_at: "2026-10-31T01:00:00.000Z",
    updated_at: "2026-10-31T01:00:00.000Z",
  },
  {
    device_id: "00000000-0000-0000-0000-000000000002",
    project_id: "project-2",
    voted_on: "2026-11-01",
    created_at: "2026-11-01T01:00:00.000Z",
    updated_at: "2026-11-01T01:00:00.000Z",
  },
]

describe("vote totals", () => {
  it("counts persisted votes by project", () => {
    expect(projectVoteTotal("project-1", votes)).toBe(1)
    expect(projectVoteTotal("project-3", votes)).toBe(0)
  })

  it("counts all accepted votes", () => {
    expect(totalVotes(votes)).toBe(2)
  })

  it("counts distinct voting devices separately from votes", () => {
    expect(
      votingDeviceCount([
        ...votes,
        {
          ...votes[0],
          project_id: "project-2",
        },
      ]),
    ).toBe(2)
  })

  it("groups votes by the selected preview date", () => {
    expect(votesByDate(votes)).toEqual({
      "2026-10-31": 1,
      "2026-11-01": 1,
    })
  })

  it("filters votes to one voting date", () => {
    expect(votesOnDate(votes, "2026-11-01")).toEqual([votes[1]])
    expect(votesOnDate(votes, "2026-11-02")).toEqual([])
  })

  it("appends only new device, project, and date combinations", () => {
    expect(appendVisitorVote(votes, votes[0])).toBe(votes)
    expect(
      appendVisitorVote(votes, {
        ...votes[0],
        project_id: "project-2",
      }),
    ).toHaveLength(3)
  })
})
