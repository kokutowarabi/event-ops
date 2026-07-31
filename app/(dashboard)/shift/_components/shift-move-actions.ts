import { useCallback, useEffect, useRef, type Dispatch, type PointerEvent, type SetStateAction } from "react"
import type { Shift } from "@/lib/shift-data"
import {
  canPlaceShift,
  copyShiftForMember,
  END_MINUTES,
  getVerticalCopyPlan,
  SLOT_MINUTES,
  START_MINUTES,
} from "./shift-domain"
import {
  getMemberIdFromPointer,
  getMemberRowsFromPointer,
  getMemberRowFromPointer,
  getNearestMemberRowFromPointer,
  type PointerCoordinates,
} from "./shift-pointer"
import { MOVE_LONG_PRESS_MS, SLOT_WIDTH } from "./shift-layout"
import type { CopyingShift, MovingShift, PendingMovePress } from "./shift-types"
import { useVerticalDragAutoScroll } from "./shift-vertical-auto-scroll"

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
  shiftsRef: { current: Shift[] }
  setCopying: Dispatch<SetStateAction<CopyingShift | null>>
  recordShiftsChange: (updater: (current: Shift[]) => Shift[]) => void
}

export function useShiftCopyActions({
  editable,
  shiftsRef,
  setCopying,
  recordShiftsChange,
}: ShiftCopyActionsOptions) {
  const isFinishingCopyRef = useRef(false)
  const copyingStateRef = useRef<CopyingShift | null>(null)
  const sourceElementRef = useRef<HTMLElement | null>(null)
  const removeCopyListenersRef = useRef<(() => void) | null>(null)
  const cleanupCopyListeners = useCallback(() => {
    removeCopyListenersRef.current?.()
    removeCopyListenersRef.current = null
  }, [])

  const updateCopyPreview = useCallback((event: PointerCoordinates) => {
    const activeCopying = copyingStateRef.current
    if (!activeCopying) return
    const sourceShift = shiftsRef.current.find((shift) => shift.id === activeCopying.sourceId)
    if (!sourceShift) return
    const candidateRow = getMemberRowFromPointer(event) ?? getNearestMemberRowFromPointer(event)
    const candidateMemberId = candidateRow?.dataset.shiftMemberId ?? sourceShift.memberId
    const memberRows = getMemberRowsFromPointer(event)
    const copyPlan = getVerticalCopyPlan(
      shiftsRef.current,
      sourceShift,
      memberRows.map(({ row }) => row.dataset.shiftMemberId ?? ""),
      candidateMemberId,
    )
    const lastIncludedMemberId = copyPlan.includedMemberIds.at(-1) ?? sourceShift.memberId
    const sourceRow = memberRows.find(({ row }) => row.dataset.shiftMemberId === sourceShift.memberId)
    const lastIncludedRow = memberRows.find(({ row }) => row.dataset.shiftMemberId === lastIncludedMemberId)
    const sourceRect = sourceElementRef.current?.getBoundingClientRect() ?? activeCopying.sourceRect
    const sourceTop = sourceRect.top
    const sourceHeight = sourceRect.height
    const sourceRowOffset = sourceRow ? sourceTop - sourceRow.rect.top : 0
    const targetTop = lastIncludedRow ? lastIncludedRow.rect.top + sourceRowOffset : sourceTop
    const nextCopying: CopyingShift = {
      ...activeCopying,
      previewMemberIds: copyPlan.includedMemberIds.filter(
        (memberId) => memberId !== sourceShift.memberId,
      ),
      targetMemberIds: copyPlan.targetMemberIds,
      stretchRect: {
        ...activeCopying.stretchRect,
        left: sourceRect.left,
        top: Math.min(sourceTop, targetTop),
        width: sourceRect.width,
        height: Math.abs(targetTop - sourceTop) + sourceHeight,
      },
    }
    copyingStateRef.current = nextCopying
    setCopying(nextCopying)
  }, [setCopying, shiftsRef])

  const {
    start: startAutoScroll,
    update: updateAutoScroll,
    stop: stopAutoScroll,
  } = useVerticalDragAutoScroll(updateCopyPreview)
  const moveCopyShift = useCallback((event: PointerCoordinates) => {
    const pointer = { clientX: event.clientX, clientY: event.clientY }
    updateCopyPreview(pointer)
    updateAutoScroll(pointer)
  }, [updateAutoScroll, updateCopyPreview])

  const stopCopyShift = useCallback(() => {
    const activeCopying = copyingStateRef.current
    if (!activeCopying || isFinishingCopyRef.current) return
    isFinishingCopyRef.current = true
    cleanupCopyListeners()
    stopAutoScroll()
    const sourceShift = shiftsRef.current.find((shift) => shift.id === activeCopying.sourceId)
    if (sourceShift && activeCopying.targetMemberIds.length > 0) {
      const copiedShifts = activeCopying.targetMemberIds.map((memberId) =>
        copyShiftForMember(sourceShift, memberId, `shift-${crypto.randomUUID()}`),
      )
      recordShiftsChange((current) => [...current, ...copiedShifts])
    }
    copyingStateRef.current = null
    sourceElementRef.current = null
    setCopying(null)
  }, [cleanupCopyListeners, recordShiftsChange, setCopying, shiftsRef, stopAutoScroll])

  const cancelCopyShift = useCallback(() => {
    if (isFinishingCopyRef.current) return
    isFinishingCopyRef.current = true
    cleanupCopyListeners()
    stopAutoScroll()
    copyingStateRef.current = null
    sourceElementRef.current = null
    setCopying(null)
  }, [cleanupCopyListeners, setCopying, stopAutoScroll])

  const startCopyShift = (shift: Shift, event: PointerEvent<HTMLSpanElement>) => {
    if (!editable) return
    isFinishingCopyRef.current = false
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const sourceElement =
      event.currentTarget.parentElement?.querySelector<HTMLElement>("[data-shift-block]") ?? null
    const sourceRect = (sourceElement ?? event.currentTarget).getBoundingClientRect()
    sourceElementRef.current = sourceElement
    const copyRect = {
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
    }
    const nextCopying: CopyingShift = {
      sourceId: shift.id,
      previewMemberIds: [],
      targetMemberIds: [],
      sourceRect: copyRect,
      stretchRect: copyRect,
    }
    copyingStateRef.current = nextCopying
    setCopying(nextCopying)

    const scrollContainer = event.currentTarget.closest<HTMLElement>("[data-shift-scroll-container]")
    if (scrollContainer) {
      startAutoScroll(scrollContainer, {
        clientX: event.clientX,
        clientY: event.clientY,
      })
    }

    cleanupCopyListeners()
    window.addEventListener("pointermove", moveCopyShift)
    window.addEventListener("pointerup", stopCopyShift)
    window.addEventListener("pointercancel", cancelCopyShift)
    removeCopyListenersRef.current = () => {
      window.removeEventListener("pointermove", moveCopyShift)
      window.removeEventListener("pointerup", stopCopyShift)
      window.removeEventListener("pointercancel", cancelCopyShift)
    }
  }

  useEffect(() => {
    return cleanupCopyListeners
  }, [cleanupCopyListeners])

  return { startCopyShift, moveCopyShift, stopCopyShift, cancelCopyShift }
}
