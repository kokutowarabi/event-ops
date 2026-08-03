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
import { SLOT_WIDTH, TIMELINE_PADDING_WIDTH } from "./shift-layout"
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
  const getSlotFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const position = event.clientX - rect.left
    return Math.min(
      Math.max(Math.floor(position / SLOT_WIDTH), 0),
      timeSlots.length - 1,
    )
  }

  const beginCreateShift = (
    memberId: string,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (!editable || !hasSchedule) return
    const slot = getSlotFromPointer(event)
    if (isSlotOccupied(shiftsRef.current, memberId, selectedDate, slot)) {
      setHoveredSlot(null)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    initialShiftsRef.current = shiftsRef.current
    setHoveredSlot({ memberId, slot })
    setCreatingShift({ memberId, startSlot: slot, currentSlot: slot, adjustedShiftIds: [] })
  }

  const moveCreateShift = (
    memberId: string,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (!editable || !hasSchedule) return
    const slot = getSlotFromPointer(event)
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

  return {
    beginCreateShift,
    moveCreateShift,
    finishCreateShift: finishCreate,
    cancelCreateShift: cancelCreate,
    getCreatePreview,
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
