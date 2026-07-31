import { useCallback, useEffect, useRef } from "react"
import type { PointerCoordinates } from "./shift-pointer"

const AUTO_SCROLL_EDGE = 72
const MAX_SCROLL_PER_FRAME = 18

type VerticalBounds = {
  top: number
  bottom: number
}

export function getVerticalAutoScrollDelta(
  pointerY: number,
  bounds: VerticalBounds,
) {
  const edge = Math.min(AUTO_SCROLL_EDGE, (bounds.bottom - bounds.top) / 2)
  if (edge <= 0) return 0
  const topEdge = bounds.top + edge
  const bottomEdge = bounds.bottom - edge

  if (pointerY < topEdge) {
    const intensity = Math.min(1, (topEdge - pointerY) / edge)
    return -Math.ceil(MAX_SCROLL_PER_FRAME * intensity)
  }
  if (pointerY > bottomEdge) {
    const intensity = Math.min(1, (pointerY - bottomEdge) / edge)
    return Math.ceil(MAX_SCROLL_PER_FRAME * intensity)
  }
  return 0
}

export function useVerticalDragAutoScroll(
  onScroll: (pointer: PointerCoordinates) => void,
) {
  const containerRef = useRef<HTMLElement | null>(null)
  const pointerRef = useRef<PointerCoordinates | null>(null)
  const frameRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    containerRef.current = null
    pointerRef.current = null
  }, [])

  const scheduleFrame = useCallback(() => {
    if (frameRef.current !== null) return

    const scrollFrame = () => {
      frameRef.current = null
      const container = containerRef.current
      const pointer = pointerRef.current
      if (!container || !pointer) return

      const delta = getVerticalAutoScrollDelta(
        pointer.clientY,
        container.getBoundingClientRect(),
      )
      if (delta === 0) return

      const previousScrollTop = container.scrollTop
      container.scrollTop += delta
      if (container.scrollTop === previousScrollTop) return

      onScroll(pointer)
      frameRef.current = requestAnimationFrame(scrollFrame)
    }

    frameRef.current = requestAnimationFrame(scrollFrame)
  }, [onScroll])

  const start = useCallback((container: HTMLElement, pointer: PointerCoordinates) => {
    containerRef.current = container
    pointerRef.current = pointer
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
