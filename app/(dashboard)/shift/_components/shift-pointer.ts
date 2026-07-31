import type { PointerEvent } from "react"

export function getMemberRowFromPointer(event: PointerEvent<HTMLElement>) {
  const rows = document.querySelectorAll<HTMLElement>("[data-shift-member-id]")
  for (const row of rows) {
    const rect = row.getBoundingClientRect()
    if (
      event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom
    ) {
      return row
    }
  }
  return null
}

export function getNearestVerticalRectIndex(
  rects: Array<{ top: number; bottom: number }>,
  pointerY: number,
) {
  if (rects.length === 0) return -1
  return rects.reduce((nearestIndex, rect, index) => {
    const distance = pointerY < rect.top
      ? rect.top - pointerY
      : pointerY > rect.bottom
        ? pointerY - rect.bottom
        : 0
    const nearestRect = rects[nearestIndex]
    const nearestDistance = pointerY < nearestRect.top
      ? nearestRect.top - pointerY
      : pointerY > nearestRect.bottom
        ? pointerY - nearestRect.bottom
        : 0
    return distance < nearestDistance ? index : nearestIndex
  }, 0)
}

export function getNearestMemberRowFromPointer(event: PointerEvent<HTMLElement>) {
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-shift-member-id]"))
    .map((row) => ({ row, rect: row.getBoundingClientRect() }))
    .filter(
      ({ rect }) =>
        rect.width > 0
        && rect.height > 0
        && event.clientX >= rect.left
        && event.clientX <= rect.right,
    )
  const nearestIndex = getNearestVerticalRectIndex(
    rows.map(({ rect }) => rect),
    event.clientY,
  )
  return nearestIndex >= 0 ? rows[nearestIndex].row : null
}

export function getMemberIdFromPointer(event: PointerEvent<HTMLElement>) {
  return getMemberRowFromPointer(event)?.dataset.shiftMemberId ?? null
}
