import type { Dispatch, PointerEvent, SetStateAction } from "react"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import {
  adjustConflictingShiftRanges,
  clampShiftEnd,
  DEFAULT_SHIFT_TEMPLATE_ID,
  getCreateShiftTimeRange,
  isSlotOccupied,
  timeSlots,
} from "./shift-domain"
import {
  MOBILE_SLOT_HEIGHT,
  MOBILE_TIMELINE_PADDING_HEIGHT,
  SLOT_WIDTH,
  TIMELINE_PADDING_WIDTH,
} from "./shift-layout"
import type { CreatingShift, DraftShift, DraftShiftSetter } from "./shift-types"

type ShiftCreationActionsOptions = {
  editable: boolean
  hasSchedule: boolean
  selectedDate: string
  creatingShift: CreatingShift | null
  shiftsRef: { current: Shift[] }
  initialShiftsRef: { current: Shift[] | null }
  templates: Record<ShiftTemplateId, ShiftTemplate>
  setCreatingShift: Dispatch<SetStateAction<CreatingShift | null>>
  setHoveredSlot: Dispatch<SetStateAction<{ memberId: string; slot: number } | null>>
  setDraftBaseShifts: Dispatch<SetStateAction<Shift[] | null>>
  setDraftShift: DraftShiftSetter
  setShiftsWithoutHistory: (shifts: Shift[]) => void
}

export function useShiftCreationActions({
  editable,
  hasSchedule,
  selectedDate,
  creatingShift,
  shiftsRef,
  initialShiftsRef,
  templates,
  setCreatingShift,
  setHoveredSlot,
  setDraftBaseShifts,
  setDraftShift,
  setShiftsWithoutHistory,
}: ShiftCreationActionsOptions) {
  const getSlotFromPointer = (event: PointerEvent<HTMLButtonElement>, orientation: "horizontal" | "vertical") => {
    const rect = event.currentTarget.getBoundingClientRect()
    const position = orientation === "horizontal" ? event.clientX - rect.left : event.clientY - rect.top
    const slotSize = orientation === "horizontal" ? SLOT_WIDTH : MOBILE_SLOT_HEIGHT
    return Math.min(Math.max(Math.floor(position / slotSize), 0), timeSlots.length - 1)
  }

  const beginCreate = (
    memberId: string,
    event: PointerEvent<HTMLButtonElement>,
    orientation: "horizontal" | "vertical",
  ) => {
    if (!editable || !hasSchedule) return
    const slot = getSlotFromPointer(event, orientation)
    if (isSlotOccupied(shiftsRef.current, memberId, selectedDate, slot)) {
      setHoveredSlot(null)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    initialShiftsRef.current = shiftsRef.current
    setHoveredSlot({ memberId, slot })
    setCreatingShift({ memberId, startSlot: slot, currentSlot: slot, adjustedShiftIds: [] })
  }

  const moveCreate = (
    memberId: string,
    event: PointerEvent<HTMLButtonElement>,
    orientation: "horizontal" | "vertical",
  ) => {
    if (!editable || !hasSchedule) return
    const slot = getSlotFromPointer(event, orientation)
    if (!creatingShift) {
      setHoveredSlot(
        isSlotOccupied(shiftsRef.current, memberId, selectedDate, slot)
          ? null
          : { memberId, slot },
      )
      return
    }
    if (creatingShift.memberId !== memberId) return
    const { start, end } = getCreateShiftTimeRange(creatingShift.startSlot, slot)
    const baseShifts = initialShiftsRef.current ?? shiftsRef.current
    const conflictResolution = adjustConflictingShiftRanges(
      baseShifts,
      memberId,
      selectedDate,
      start,
      end,
    )
    if (!conflictResolution) {
      setHoveredSlot(null)
      return
    }
    setShiftsWithoutHistory(conflictResolution.shifts)
    setHoveredSlot({ memberId, slot })
    setCreatingShift({
      ...creatingShift,
      currentSlot: slot,
      adjustedShiftIds: conflictResolution.adjustedShiftIds,
    })
  }

  const finishCreate = (memberId: string) => {
    if (!creatingShift || creatingShift.memberId !== memberId) return
    const { start, end } = getCreateShiftTimeRange(creatingShift.startSlot, creatingShift.currentSlot)
    const baseShifts = initialShiftsRef.current
    setDraftBaseShifts(baseShifts)
    if (baseShifts) setShiftsWithoutHistory(baseShifts)
    initialShiftsRef.current = null
    setDraftShift(createDraft(memberId, selectedDate, start, end, templates))
    setCreatingShift(null)
    setHoveredSlot(null)
  }

  const cancelCreate = () => {
    if (initialShiftsRef.current) setShiftsWithoutHistory(initialShiftsRef.current)
    initialShiftsRef.current = null
    setCreatingShift(null)
    setHoveredSlot(null)
  }

  const getCreatePreview = (memberId: string) => {
    const range = getPreviewRange(creatingShift, memberId)
    if (!range) return null
    return {
      left: TIMELINE_PADDING_WIDTH + range.startSlot * SLOT_WIDTH,
      width: Math.max((range.endSlot - range.startSlot) * SLOT_WIDTH, SLOT_WIDTH),
      start: range.start,
      end: range.end,
      adjustsConflictingShifts: range.adjustsConflictingShifts,
    }
  }

  const getMobileCreatePreview = (memberId: string) => {
    const range = getPreviewRange(creatingShift, memberId)
    if (!range) return null
    return {
      top: MOBILE_TIMELINE_PADDING_HEIGHT + range.startSlot * MOBILE_SLOT_HEIGHT,
      height: Math.max((range.endSlot - range.startSlot) * MOBILE_SLOT_HEIGHT, MOBILE_SLOT_HEIGHT),
      startSlot: range.startSlot,
      endSlot: range.endSlot,
      start: range.start,
      end: range.end,
      adjustsConflictingShifts: range.adjustsConflictingShifts,
    }
  }

  return {
    beginCreateShift: (memberId: string, event: PointerEvent<HTMLButtonElement>) =>
      beginCreate(memberId, event, "horizontal"),
    moveCreateShift: (memberId: string, event: PointerEvent<HTMLButtonElement>) =>
      moveCreate(memberId, event, "horizontal"),
    beginCreateMobileShift: (memberId: string, event: PointerEvent<HTMLButtonElement>) =>
      beginCreate(memberId, event, "vertical"),
    moveCreateMobileShift: (memberId: string, event: PointerEvent<HTMLButtonElement>) =>
      moveCreate(memberId, event, "vertical"),
    finishCreateShift: finishCreate,
    cancelCreateShift: cancelCreate,
    getCreatePreview,
    getMobileCreatePreview,
  }
}

function getPreviewRange(creatingShift: CreatingShift | null, memberId: string) {
  if (!creatingShift || creatingShift.memberId !== memberId) return null
  const startSlot = Math.min(creatingShift.startSlot, creatingShift.currentSlot)
  const endSlot = Math.max(creatingShift.startSlot, creatingShift.currentSlot) + 1
  const { start, end } = getCreateShiftTimeRange(creatingShift.startSlot, creatingShift.currentSlot)
  return {
    startSlot,
    endSlot,
    start,
    end,
    adjustsConflictingShifts: creatingShift.adjustedShiftIds.length > 0,
  }
}

function createDraft(
  memberId: string,
  date: string,
  start: number,
  end: number,
  templates: Record<ShiftTemplateId, ShiftTemplate>,
): DraftShift {
  return {
    memberId,
    date,
    start,
    end: clampShiftEnd(end, start),
    templateId: DEFAULT_SHIFT_TEMPLATE_ID,
    note: templates[DEFAULT_SHIFT_TEMPLATE_ID].note,
  }
}
