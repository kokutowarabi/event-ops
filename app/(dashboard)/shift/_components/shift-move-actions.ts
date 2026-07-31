import type { Dispatch, PointerEvent, SetStateAction } from "react"
import type { Shift } from "@/lib/shift-data"
import {
  canCopyShiftToMember,
  canPlaceShift,
  copyShiftForMember,
  END_MINUTES,
  SLOT_MINUTES,
  START_MINUTES,
} from "./shift-domain"
import {
  getMemberIdFromPointer,
  getMemberRowFromPointer,
  getNearestMemberRowFromPointer,
} from "./shift-pointer"
import { MOVE_LONG_PRESS_MS, SLOT_WIDTH } from "./shift-layout"
import type { CopyingShift, MovingShift, PendingMovePress } from "./shift-types"

type ShiftMoveActionsOptions = {
  editable: boolean
  moving: MovingShift | null
  shiftsRef: { current: Shift[] }
  initialShiftsRef: { current: Shift[] | null }
  pendingPressRef: { current: PendingMovePress | null }
  didMoveRef: { current: boolean }
  setMoving: Dispatch<SetStateAction<MovingShift | null>>
  setShiftsWithoutHistory: (shifts: Shift[]) => void
  commitShiftPreview: (initialShifts: Shift[] | null) => void
}

export function useShiftMoveActions({
  editable,
  moving,
  shiftsRef,
  initialShiftsRef,
  pendingPressRef,
  didMoveRef,
  setMoving,
  setShiftsWithoutHistory,
  commitShiftPreview,
}: ShiftMoveActionsOptions) {
  const activateMove = (
    shift: Shift,
    element: HTMLDivElement,
    pointerId: number,
    clientX: number,
    clientY: number,
  ) => {
    if (!editable || !element.isConnected) return
    try {
      element.setPointerCapture(pointerId)
    } catch {
      return
    }
    const rect = element.getBoundingClientRect()
    initialShiftsRef.current = shiftsRef.current
    didMoveRef.current = false
    setMoving({
      id: shift.id,
      originX: clientX,
      pointerOffsetX: clientX - rect.left,
      pointerX: clientX,
      pointerY: clientY,
      start: shift.start,
      end: shift.end,
      previewMemberId: shift.memberId,
      canDrop: true,
    })
  }

  const startMovePress = (shift: Shift, event: PointerEvent<HTMLDivElement>) => {
    if (!editable || event.button !== 0) return
    const previousPending = pendingPressRef.current
    if (previousPending) window.clearTimeout(previousPending.timerId)
    const pending: PendingMovePress = {
      timerId: 0,
      shift,
      element: event.currentTarget,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    }
    pending.timerId = window.setTimeout(() => {
      if (pendingPressRef.current !== pending) return
      pendingPressRef.current = null
      activateMove(
        pending.shift,
        pending.element,
        pending.pointerId,
        pending.clientX,
        pending.clientY,
      )
    }, MOVE_LONG_PRESS_MS)
    pendingPressRef.current = pending
  }

  const updateMovePress = (event: PointerEvent<HTMLDivElement>) => {
    const pending = pendingPressRef.current
    if (!pending || pending.pointerId !== event.pointerId) return
    pending.clientX = event.clientX
    pending.clientY = event.clientY
  }

  const cancelMovePress = () => {
    const pending = pendingPressRef.current
    if (!pending) return
    window.clearTimeout(pending.timerId)
    pendingPressRef.current = null
  }

  const moveShift = (event: PointerEvent<HTMLDivElement>) => {
    if (!moving) return
    const baseShifts = initialShiftsRef.current ?? shiftsRef.current
    const shift = baseShifts.find((item) => item.id === moving.id)
    if (!shift) return
    const candidateMemberId = getMemberIdFromPointer(event) ?? moving.previewMemberId
    const deltaSlots = Math.round((event.clientX - moving.originX) / SLOT_WIDTH)
    if (deltaSlots !== 0) didMoveRef.current = true
    const duration = moving.end - moving.start
    const start = Math.min(
      Math.max(moving.start + deltaSlots * SLOT_MINUTES, START_MINUTES),
      END_MINUTES - duration,
    )
    const end = start + duration
    const canDrop = canPlaceShift(
      baseShifts,
      candidateMemberId,
      shift.date,
      start,
      end,
      moving.id,
    )
    setShiftsWithoutHistory(
      canDrop
        ? baseShifts.map((item) => (item.id === moving.id ? { ...item, start, end } : item))
        : baseShifts,
    )
    setMoving((current) =>
      current
        ? {
          ...current,
          pointerX: event.clientX,
          pointerY: event.clientY,
          previewMemberId: candidateMemberId,
          canDrop,
        }
        : current,
    )
  }

  const stopMove = () => {
    if (moving) {
      if (!moving.canDrop) {
        if (initialShiftsRef.current) setShiftsWithoutHistory(initialShiftsRef.current)
        initialShiftsRef.current = null
        didMoveRef.current = true
        setMoving(null)
        return
      }
      const shift = shiftsRef.current.find((item) => item.id === moving.id)
      const memberId = moving.previewMemberId
      if (shift && memberId && memberId !== shift.memberId) {
        didMoveRef.current = true
        setShiftsWithoutHistory(
          shiftsRef.current.map((item) => (item.id === moving.id ? { ...item, memberId } : item)),
        )
      }
    }
    commitShiftPreview(initialShiftsRef.current)
    initialShiftsRef.current = null
    setMoving(null)
  }

  const cancelMove = () => {
    if (initialShiftsRef.current) setShiftsWithoutHistory(initialShiftsRef.current)
    initialShiftsRef.current = null
    didMoveRef.current = false
    setMoving(null)
  }

  return { startMovePress, updateMovePress, cancelMovePress, moveShift, stopMove, cancelMove }
}

type ShiftCopyActionsOptions = {
  editable: boolean
  copying: CopyingShift | null
  shiftsRef: { current: Shift[] }
  setCopying: Dispatch<SetStateAction<CopyingShift | null>>
  recordShiftsChange: (updater: (current: Shift[]) => Shift[]) => void
}

export function useShiftCopyActions({
  editable,
  copying,
  shiftsRef,
  setCopying,
  recordShiftsChange,
}: ShiftCopyActionsOptions) {
  const startCopyShift = (shift: Shift, event: PointerEvent<HTMLSpanElement>) => {
    if (!editable) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const sourceElement = event.currentTarget.parentElement?.querySelector<HTMLElement>("[data-shift-block]")
    const sourceRect = (sourceElement ?? event.currentTarget).getBoundingClientRect()
    const copyRect = {
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
    }
    setCopying({
      sourceId: shift.id,
      previewMemberId: shift.memberId,
      canDrop: false,
      sourceRect: copyRect,
      stretchRect: copyRect,
    })
  }

  const moveCopyShift = (event: PointerEvent<HTMLSpanElement>) => {
    if (!copying) return
    const sourceShift = shiftsRef.current.find((shift) => shift.id === copying.sourceId)
    if (!sourceShift) return
    const candidateRow = getMemberRowFromPointer(event) ?? getNearestMemberRowFromPointer(event)
    const candidateMemberId = candidateRow?.dataset.shiftMemberId ?? copying.previewMemberId
    const canDrop = canCopyShiftToMember(shiftsRef.current, sourceShift, candidateMemberId)
    const sourceTop = copying.sourceRect.top
    const sourceHeight = copying.sourceRect.height
    const targetTop = candidateRow ? event.clientY - sourceHeight / 2 : sourceTop
    setCopying((current) =>
      current
        ? {
          ...current,
          previewMemberId: candidateMemberId,
          canDrop,
          stretchRect: {
            ...current.stretchRect,
            top: Math.min(sourceTop, targetTop),
            height: Math.abs(targetTop - sourceTop) + sourceHeight,
          },
        }
        : current,
    )
  }

  const stopCopyShift = () => {
    if (!copying) return
    const sourceShift = shiftsRef.current.find((shift) => shift.id === copying.sourceId)
    if (sourceShift && copying.canDrop && copying.previewMemberId !== sourceShift.memberId) {
      const copiedShift = copyShiftForMember(
        sourceShift,
        copying.previewMemberId,
        `shift-${crypto.randomUUID()}`,
      )
      recordShiftsChange((current) => [...current, copiedShift])
    }
    setCopying(null)
  }

  const cancelCopyShift = () => setCopying(null)

  return { startCopyShift, moveCopyShift, stopCopyShift, cancelCopyShift }
}
