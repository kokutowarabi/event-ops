import { describe, expect, it } from "vitest"
import { baseVoteCounts, projectVoteTotal, totalVotes } from "@/lib/votes"

describe("vote totals", () => {
  it("adds one local vote to the seeded result", () => {
    expect(projectVoteTotal("project-1", ["project-1"])).toBe(baseVoteCounts["project-1"] + 1)
  })

  it("does not count an unrelated local vote", () => {
    expect(totalVotes(["project-1"], ["project-2"])).toBe(baseVoteCounts["project-1"])
  })
})
