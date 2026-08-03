import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Member } from "@/lib/members"
import type { Shift } from "@/lib/shift-data"
import { shiftTemplates } from "./shift-domain"
import { useShiftDrafts } from "./use-shift-drafts"

const member: Member = {
  id: "member-a",
  name: "田中 太郎",
  email: "tanaka@example.com",
  department: "執行部",
  role: "委員長",
}

const nextShift: Shift = {
  id: "shift-a",
  memberId: member.id,
  date: "2026-10-26",
  start: 8 * 60 + 30,
  end: 9 * 60,
  templateId: "reception",
  kind: "morning",
  note: "受付",
}

function renderDrafts(selectedDateShifts: Shift[]) {
  return renderHook(() =>
    useShiftDrafts({
      selectedDate: "2026-10-26",
      scheduledMembers: [member],
      selectedDateShifts,
      shifts: selectedDateShifts,
      templates: shiftTemplates,
      setCustomTemplates: vi.fn(),
      setShiftsWithoutHistory: vi.fn(),
      recordHistorySnapshot: vi.fn(),
    }),
  )
}

describe("mobile shift draft", () => {
  it("opens a draft from the tapped start time without crossing the next shift", () => {
    const { result } = renderDrafts([nextShift])

    act(() => result.current.openMemberDraft(member.id, 8 * 60))

    expect(result.current.draftShift).toMatchObject({
      memberId: member.id,
      start: 8 * 60,
      end: 8 * 60 + 30,
      templateId: "tentative",
    })
  })

  it("does not open a draft when the tapped time is occupied", () => {
    const { result } = renderDrafts([nextShift])

    act(() => result.current.openMemberDraft(member.id, 8 * 60 + 30))

    expect(result.current.draftShift).toBeNull()
  })
})
