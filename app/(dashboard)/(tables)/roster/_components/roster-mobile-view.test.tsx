import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Member } from "@/lib/members"
import { groupMembersByDepartment, RosterMobileView } from "./roster-mobile-view"

const members: Member[] = [
  { id: "1", name: "田中 太郎", email: "tanaka@example.com", department: "執行部", role: "委員長" },
  { id: "2", name: "佐藤 花子", email: "sato@example.com", department: "執行部", role: "副委員長" },
  { id: "3", name: "鈴木 一郎", email: "suzuki@example.com", department: "運営局", role: "局長" },
]

afterEach(cleanup)

describe("roster mobile view", () => {
  it("groups members into vertical department sections", () => {
    expect(groupMembersByDepartment(members)).toEqual([
      { department: "執行部", members: members.slice(0, 2) },
      { department: "運営局", members: members.slice(2) },
    ])
  })

  it("renders every member as a card and exposes the filter action", () => {
    const onFiltersOpenChange = vi.fn()
    render(
      <RosterMobileView
        members={members}
        adding={false}
        draft={{ name: "", email: "", department: "執行部", role: "" }}
        filtersOpen={false}
        query=""
        filters={{ name: [], email: [], department: [], role: [] }}
        departments={["執行部", "運営局"]}
        roles={["委員長", "副委員長", "局長"]}
        onDraftChange={vi.fn()}
        onFiltersOpenChange={onFiltersOpenChange}
        onQueryChange={vi.fn()}
        onFilterChange={vi.fn()}
        onClearFilters={vi.fn()}
        onEditMember={vi.fn()}
        onDeleteMember={vi.fn()}
      />,
    )

    expect(screen.getAllByRole("article")).toHaveLength(3)
    fireEvent.click(screen.getByRole("button", { name: /絞り込み.*3人/ }))
    expect(onFiltersOpenChange).toHaveBeenCalledWith(true)
  })
})
