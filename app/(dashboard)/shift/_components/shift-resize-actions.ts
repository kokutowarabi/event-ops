import type { Dispatch, PointerEvent, SetStateAction } from "react"
import type { Shift } from "@/lib/shift-data"
import {
  adjustConflictingShiftRanges,
  END_MINUTES,
  getShiftAdjustmentChanges,
  SLOT_MINUTES,
  START_MINUTES,
} from "./shift-domain"
import { SLOT_WIDTH } from "./shift-layout"
import type { PendingShiftAdjustment, ResizeEdge, ResizingShift } from "./shift-types"

type ShiftResizeActionsOptions = {
  editable: boolean
  resizing: ResizingShift | null
  shiftsRef: { current: Shift[] }
  initialShiftsRef: { current: Shift[] | null }
  didResizeRef: { current: boolean }
  setResizing: Dispatch<SetStateAction<ResizingShift | null>>
  setPendingAdjustment: Dispatch<SetStateAction<PendingShiftAdjustment | null>>
  setShiftsWithoutHistory: (shifts: Shift[]) => void
  commitShiftPreview: (initialShifts: Shift[] | null) => void
}

export function useShiftResizeActions({
  editable,
  resizing,
  shiftsRef,
  initialShiftsRef,
  didResizeRef,
  setResizing,
  setPendingAdjustment,
  setShiftsWithoutHistory,
  commitShiftPreview,
}: ShiftResizeActionsOptions) {
  const startResize = (shift: Shift, edge: ResizeEdge, event: PointerEvent<HTMLSpanElement>) => {
    if (!editable) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    initialShiftsRef.current = shiftsRef.current
    didResizeRef.current = false
    setResizing({
      id: shift.id,
      edge,
      originX: event.clientX,
      start: shift.start,
      end: shift.end,
      adjustedShiftIds: [],
    })
  }

  const moveResize = (event: PointerEvent<HTMLElement>) => {
    if (!resizing) return
    const baseShifts = initialShiftsRef.current ?? shiftsRef.current
    const shift = baseShifts.find((item) => item.id === resizing.id)
    if (!shift) return
    const deltaSlots = Math.round((event.clientX - resizing.originX) / SLOT_WIDTH)
    if (deltaSlots !== 0) didResizeRef.current = true
    const deltaMinutes = deltaSlots * SLOT_MINUTES
    const desiredRange =
      resizing.edge === "start"
        ? {
          start: Math.min(
            Math.max(resizing.start + deltaMinutes, START_MINUTES),
            resizing.end - SLOT_MINUTES,
          ),
          end: resizing.end,
        }
        : {
          start: resizing.start,
          end: Math.max(
            Math.min(resizing.end + deltaMinutes, END_MINUTES),
            resizing.start + SLOT_MINUTES,
          ),
        }
    const conflictResolution = adjustConflictingShiftRanges(
      baseShifts,
      shift.memberId,
      shift.date,
      desiredRange.start,
      desiredRange.end,
      resizing.id,
    )
    if (conflictResolution) {
      setShiftsWithoutHistory(
        conflictResolution.shifts.map((item) =>
          item.id === resizing.id ? { ...item, ...desiredRange } : item,
        ),
      )
      setResizing((current) =>
        current ? { ...current, adjustedShiftIds: conflictResolution.adjustedShiftIds } : current,
      )
      return
    }
    setShiftsWithoutHistory(baseShifts)
    setResizing((current) => (current ? { ...current, adjustedShiftIds: [] } : current))
  }

  const stopResize = () => {
    const baseShifts = initialShiftsRef.current
    if (baseShifts && resizing) {
      const nextShifts = shiftsRef.current
      const affectedOtherShifts = getShiftAdjustmentChanges(baseShifts, nextShifts, resizing.id)
      if (affectedOtherShifts.length > 0) {
        setShiftsWithoutHistory(baseShifts)
        setPendingAdjustment({
          baseShifts,
          nextShifts,
          changes: getShiftAdjustmentChanges(baseShifts, nextShifts),
        })
      } else {
        commitShiftPreview(baseShifts)
      }
    }
    initialShiftsRef.current = null
    setResizing(null)
  }

  const cancelResize = () => {
    if (initialShiftsRef.current) setShiftsWithoutHistory(initialShiftsRef.current)
    initialShiftsRef.current = null
    didResizeRef.current = false
    setResizing(null)
  }

  return { startResize, moveResize, stopResize, cancelResize }
}
