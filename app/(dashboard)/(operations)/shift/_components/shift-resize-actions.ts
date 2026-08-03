import { useCallback, useRef, type Dispatch, type PointerEvent, type SetStateAction } from "react"
import type { Shift } from "@/lib/shift-data"
import {
  adjustConflictingShiftRanges,
  getShiftAdjustmentChanges,
  SLOT_MINUTES,
} from "./shift-domain"
import { DESKTOP_MEMBER_COLUMN_WIDTH, SLOT_WIDTH } from "./shift-layout"
import { useHorizontalDragAutoScroll } from "./shift-horizontal-auto-scroll"
import type { PointerCoordinates } from "./shift-pointer"
import { getResizedShiftRange } from "./shift-resize-range"
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

export function getResizeDeltaSlots(
  pointerX: number,
  originX: number,
  currentScrollLeft: number,
  originScrollLeft: number,
) {
  const deltaPixels = pointerX - originX + currentScrollLeft - originScrollLeft
  return Math.round(deltaPixels / SLOT_WIDTH)
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
  const scrollContainerRef = useRef<HTMLElement | null>(null)

  const updateResizePreview = useCallback((event: PointerCoordinates) => {
    if (!resizing) return
    const baseShifts = initialShiftsRef.current ?? shiftsRef.current
    const shift = baseShifts.find((item) => item.id === resizing.id)
    if (!shift) return
    const currentScrollLeft = scrollContainerRef.current?.scrollLeft ?? 0
    const deltaSlots = getResizeDeltaSlots(
      event.clientX,
      resizing.originX,
      currentScrollLeft,
      resizing.originScrollLeft,
    )
    if (deltaSlots !== 0) didResizeRef.current = true
    const deltaMinutes = deltaSlots * SLOT_MINUTES
    const desiredRange = getResizedShiftRange(resizing, resizing.edge, deltaMinutes)
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
  }, [
    didResizeRef,
    initialShiftsRef,
    resizing,
    setResizing,
    setShiftsWithoutHistory,
    shiftsRef,
  ])

  const {
    start: startAutoScroll,
    update: updateAutoScroll,
    stop: stopAutoScroll,
  } = useHorizontalDragAutoScroll(updateResizePreview)

  const startResize = (shift: Shift, edge: ResizeEdge, event: PointerEvent<HTMLSpanElement>) => {
    if (!editable) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    initialShiftsRef.current = shiftsRef.current
    didResizeRef.current = false
    const scrollContainer = event.currentTarget.closest<HTMLElement>(
      "[data-shift-scroll-container]",
    )
    scrollContainerRef.current = scrollContainer
    setResizing({
      id: shift.id,
      edge,
      originX: event.clientX,
      originScrollLeft: scrollContainer?.scrollLeft ?? 0,
      start: shift.start,
      end: shift.end,
      adjustedShiftIds: [],
    })
    if (scrollContainer) {
      startAutoScroll(
        scrollContainer,
        { clientX: event.clientX, clientY: event.clientY },
        DESKTOP_MEMBER_COLUMN_WIDTH,
      )
    }
  }

  const moveResize = (event: PointerCoordinates) => {
    updateResizePreview(event)
    updateAutoScroll(event)
  }

  const stopResize = () => {
    stopAutoScroll()
    scrollContainerRef.current = null
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
    stopAutoScroll()
    scrollContainerRef.current = null
    if (initialShiftsRef.current) setShiftsWithoutHistory(initialShiftsRef.current)
    initialShiftsRef.current = null
    didResizeRef.current = false
    setResizing(null)
  }

  return { startResize, moveResize, stopResize, cancelResize }
}
