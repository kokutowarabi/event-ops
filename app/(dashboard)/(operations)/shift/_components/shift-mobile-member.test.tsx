import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Member } from "@/lib/members"
import type { Shift } from "@/lib/shift-data"
import { shiftTemplates } from "./shift-domain"
import { MOBILE_SLOT_HEIGHT } from "./shift-layout"
import { ShiftMobileMember } from "./shift-mobile-member"

const member: Member = {
  id: "member-a",
  name: "田中 太郎",
  email: "tanaka@example.com",
  department: "執行部",
  role: "委員長",
}

const occupiedShift: Shift = {
  id: "shift-a",
  memberId: member.id,
  date: "2026-10-26",
  start: 7 * 60,
  end: 8 * 60,
  templateId: "reception",
  kind: "morning",
  note: "受付",
}

afterEach(cleanup)

function renderMember(shifts: Shift[], onCreateAt = vi.fn()) {
  const view = render(
    <ShiftMobileMember
      member={member}
      memo=""
      pinned={false}
      selectedDateShifts={shifts}
      visibleDateShifts={shifts}
      editable
      templates={shiftTemplates}
      getTemplateColor={() => ({ blockStyle: {}, dotStyle: {} })}
      onTogglePin={vi.fn()}
      onMemoChange={vi.fn()}
      onCreateAt={onCreateAt}
      onOpenShift={vi.fn()}
    />,
  )
  return { ...view, onCreateAt }
}

describe("shift mobile member", () => {
  it("opens shift creation at the tapped fifteen-minute slot", () => {
    const { onCreateAt } = renderMember([])
    const timeline = screen.getByRole("button", {
      name: "田中 太郎のシフトを追加",
    })

    fireEvent.click(timeline, { clientY: MOBILE_SLOT_HEIGHT * 4 + 1 })

    expect(onCreateAt).toHaveBeenCalledWith(7 * 60)
  })

  it("ignores taps on an occupied time range", () => {
    const { container, onCreateAt } = renderMember([occupiedShift])
    const blockedRange = container.querySelector(
      '[aria-label="田中 太郎のシフトを追加"] > [aria-hidden="true"]',
    )

    expect(blockedRange).toBeTruthy()
    fireEvent.click(blockedRange!)

    expect(onCreateAt).not.toHaveBeenCalled()
  })
})
