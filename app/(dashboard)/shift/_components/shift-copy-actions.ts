import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type PointerEvent,
  type SetStateAction,
} from "react"
import type { Shift } from "@/lib/shift-data"
import { copyShiftForMember, getVerticalCopyPlan } from "./shift-domain"
import {
  getMemberRowsFromPointer,
  getMemberRowFromPointer,
  getNearestMemberRowFromPointer,
  type PointerCoordinates,
} from "./shift-pointer"
import type { CopyingShift } from "./shift-types"
import { useVerticalDragAutoScroll } from "./shift-vertical-auto-scroll"

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
    const sourceShift = shiftsRef.current.find(
      (shift) => shift.id === activeCopying.sourceId,
    )
    if (!sourceShift) return
    const candidateRow =
      getMemberRowFromPointer(event) ?? getNearestMemberRowFromPointer(event)
    const candidateMemberId = candidateRow?.dataset.shiftMemberId ?? sourceShift.memberId
    const memberRows = getMemberRowsFromPointer(event)
    const copyPlan = getVerticalCopyPlan(
      shiftsRef.current,
      sourceShift,
      memberRows.map(({ row }) => row.dataset.shiftMemberId ?? ""),
      candidateMemberId,
    )
    const lastIncludedMemberId =
      copyPlan.includedMemberIds.at(-1) ?? sourceShift.memberId
    const sourceRow = memberRows.find(
      ({ row }) => row.dataset.shiftMemberId === sourceShift.memberId,
    )
    const lastIncludedRow = memberRows.find(
      ({ row }) => row.dataset.shiftMemberId === lastIncludedMemberId,
    )
    const sourceRect =
      sourceElementRef.current?.getBoundingClientRect() ?? activeCopying.sourceRect
    const sourceTop = sourceRect.top
    const sourceHeight = sourceRect.height
    const sourceRowOffset = sourceRow ? sourceTop - sourceRow.rect.top : 0
    const targetTop = lastIncludedRow
      ? lastIncludedRow.rect.top + sourceRowOffset
      : sourceTop
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
    const sourceShift = shiftsRef.current.find(
      (shift) => shift.id === activeCopying.sourceId,
    )
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
      event.currentTarget.parentElement?.querySelector<HTMLElement>("[data-shift-block]")
      ?? null
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

    const scrollContainer = event.currentTarget.closest<HTMLElement>(
      "[data-shift-scroll-container]",
    )
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

  useEffect(() => cleanupCopyListeners, [cleanupCopyListeners])

  return { startCopyShift, moveCopyShift, stopCopyShift, cancelCopyShift }
}
