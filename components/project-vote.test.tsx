import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProjectVote } from "@/components/project-vote"
import type { EventProject } from "@/lib/event-data"

const project: EventProject = {
  id: "project-1",
  title: "きらめく鉱石ラボ",
  organizationName: "星浜大学 科学探究会",
  department: "教室",
  venue: "A-204教室",
  startTime: "10:00",
  endTime: "17:00",
  owner: "運営局",
  status: "確定",
  note: "企画紹介",
}

afterEach(cleanup)

describe("vote results loading state", () => {
  it("keeps the page shell visible while only vote data is loading", () => {
    render(
      <ProjectVote
        projects={[project]}
        votes={[]}
        connectionState="connecting"
        loading
      />,
    )

    expect(screen.getByRole("heading", { name: "投票結果" })).toBeTruthy()
    expect(
      screen.getByRole("status", { name: "投票データを読み込み中" }),
    ).toBeTruthy()
    expect(
      (screen.getByRole("button", { name: "CSV" }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
