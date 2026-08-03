import type { PointerEvent } from "react"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { useShiftCreationActions } from "./shift-creation-actions"
import { SLOT_WIDTH } from "./shift-layout"

describe("shift creation hover", () => {
  it("highlights an empty fifteen-minute slot before dragging starts", () => {
    const setHoveredSlot = vi.fn()
    const { result } = renderHook(() =>
      useShiftCreationActions({
        editable: true,
        hasSchedule: true,
        selectedDate: "2026-10-26",
        creatingShift: null,
        shiftsRef: { current: [] },
        initialShiftsRef: { current: null },
        templates: {} as Record<ShiftTemplateId, ShiftTemplate>,
        setCreatingShift: vi.fn(),
        setHoveredSlot,
        setDraftBaseShifts: vi.fn(),
        setDraftShift: vi.fn(),
        setShiftsWithoutHistory: vi.fn(),
      }),
    )
    const event = {
      clientX: SLOT_WIDTH * 2 + 1,
      clientY: 0,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
      },
    } as unknown as PointerEvent<HTMLButtonElement>

    act(() => result.current.moveCreateShift("member-a", event))

    expect(setHoveredSlot).toHaveBeenCalledWith({ memberId: "member-a", slot: 2 })
  })
})
