import { useCallback, useState, type PointerEvent } from "react"

export function getShiftHoverOwnerId(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  const owner = target.closest<HTMLElement>(
    "[data-shift-block-id], [data-shift-handle-for]",
  )
  return owner?.dataset.shiftBlockId ?? owner?.dataset.shiftHandleFor ?? null
}

export function useShiftHandleHover(shiftId: string) {
  const [hovered, setHovered] = useState(false)
  const onPointerOver = useCallback(() => setHovered(true), [])
  const onPointerOut = useCallback((event: PointerEvent<Element>) => {
    setHovered(getShiftHoverOwnerId(event.relatedTarget) === shiftId)
  }, [shiftId])

  return { hovered, onPointerOver, onPointerOut }
}
