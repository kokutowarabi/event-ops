import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SitePreview } from "@/components/site-preview"
import type { EventProject } from "@/lib/event-data"

const project: EventProject = {
  id: "project-1",
  title: "変更前の企画",
  organizationName: "星浜大学 科学探究会",
  department: "教室",
  venue: "A-204教室",
  startTime: "10:00",
  endTime: "17:00",
  owner: "運営局",
  status: "準備中",
  note: "変更前の紹介",
}

afterEach(cleanup)

describe("site preview project synchronization", () => {
  it("re-renders project management changes on the site side", () => {
    const onVote = vi.fn(async () => true)
    const { rerender } = render(
      <SitePreview projects={[project]} votingConfigured={false} onVote={onVote} />,
    )

    fireEvent.click(screen.getByRole("button", { name: "企画" }))
    expect(screen.getByRole("heading", { name: "変更前の企画" })).toBeTruthy()

    rerender(
      <SitePreview
        projects={[
          {
            ...project,
            title: "変更後の企画",
            owner: "演出局",
            status: "確定",
            note: "サイトに反映された紹介",
          },
        ]}
        votingConfigured={false}
        onVote={onVote}
      />,
    )

    expect(screen.queryByRole("heading", { name: "変更前の企画" })).toBeNull()
    expect(screen.getByRole("heading", { name: "変更後の企画" })).toBeTruthy()
    expect(screen.getByText("確定")).toBeTruthy()
    expect(screen.getByText("担当: 演出局")).toBeTruthy()
    expect(screen.getByText("サイトに反映された紹介")).toBeTruthy()
  })

  it("disables a project after voting for it on the selected date", async () => {
    const onVote = vi.fn(async () => true)
    render(
      <SitePreview projects={[project]} votingConfigured onVote={onVote} />,
    )

    fireEvent.click(screen.getByRole("button", { name: "企画" }))
    fireEvent.click(screen.getByRole("button", { name: "この企画に投票" }))

    const votedButton = await screen.findByRole("button", { name: "投票済み" })
    expect(votedButton).toHaveProperty("disabled", true)
    fireEvent.click(votedButton)
    expect(onVote).toHaveBeenCalledTimes(1)
  })
})
