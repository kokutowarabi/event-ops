import { useCallback, useEffect, useRef } from "react"
import type { PointerCoordinates } from "./shift-pointer"

const AUTO_SCROLL_EDGE = 72
const MAX_SCROLL_PER_FRAME = 18

type HorizontalBounds = {
  left: number
  right: number
}

export function getHorizontalAutoScrollDelta(
  pointerX: number,
  bounds: HorizontalBounds,
) {
  const edge = Math.min(AUTO_SCROLL_EDGE, (bounds.right - bounds.left) / 2)
  if (edge <= 0) return 0
  const leftEdge = bounds.left + edge
  const rightEdge = bounds.right - edge

  if (pointerX < leftEdge) {
    const intensity = Math.min(1, (leftEdge - pointerX) / edge)
    return -Math.ceil(MAX_SCROLL_PER_FRAME * intensity)
  }
  if (pointerX > rightEdge) {
    const intensity = Math.min(1, (pointerX - rightEdge) / edge)
    return Math.ceil(MAX_SCROLL_PER_FRAME * intensity)
  }
  return 0
}

export function useHorizontalDragAutoScroll(
  onScroll: (pointer: PointerCoordinates) => void,
) {
  const onScrollRef = useRef(onScroll)
  const containerRef = useRef<HTMLElement | null>(null)
  const pointerRef = useRef<PointerCoordinates | null>(null)
  const leftInsetRef = useRef(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    onScrollRef.current = onScroll
  }, [onScroll])

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    containerRef.current = null
    pointerRef.current = null
    leftInsetRef.current = 0
  }, [])

  const scheduleFrame = useCallback(() => {
    if (frameRef.current !== null) return

    const scrollFrame = () => {
      frameRef.current = null
      const container = containerRef.current
      const pointer = pointerRef.current
      if (!container || !pointer) return

      const rect = container.getBoundingClientRect()
      const delta = getHorizontalAutoScrollDelta(pointer.clientX, {
        left: rect.left + leftInsetRef.current,
        right: rect.right,
      })
      if (delta === 0) return

      const previousScrollLeft = container.scrollLeft
      container.scrollLeft += delta
      if (container.scrollLeft === previousScrollLeft) return

      onScrollRef.current(pointer)
      frameRef.current = requestAnimationFrame(scrollFrame)
    }

    frameRef.current = requestAnimationFrame(scrollFrame)
  }, [])

  const start = useCallback((
    container: HTMLElement,
    pointer: PointerCoordinates,
    leftInset = 0,
  ) => {
    containerRef.current = container
    pointerRef.current = pointer
    leftInsetRef.current = leftInset
    scheduleFrame()
  }, [scheduleFrame])

  const update = useCallback((pointer: PointerCoordinates) => {
    if (!containerRef.current) return
    pointerRef.current = pointer
    scheduleFrame()
  }, [scheduleFrame])

  useEffect(() => stop, [stop])

  return { start, update, stop }
}
