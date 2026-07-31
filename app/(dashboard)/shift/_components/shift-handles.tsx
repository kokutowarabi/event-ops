import type { PointerEvent } from "react"
import type { Shift } from "@/lib/shift-data"
import type { ResizeEdge } from "./shift-types"

type ShiftHandlesProps = {
  left: number
  visualWidth: number
  hidden: boolean
  shift: Shift
  onStartResize: (shift: Shift, edge: ResizeEdge, event: PointerEvent<HTMLSpanElement>) => void
  onMoveResize: (event: PointerEvent<HTMLElement>) => void
  onStopResize: () => void
  onCancelResize: () => void
  onStartCopy: (shift: Shift, event: PointerEvent<HTMLSpanElement>) => void
  onMoveCopy: (event: PointerEvent<HTMLSpanElement>) => void
  onStopCopy: () => void
  onCancelCopy: () => void
}

export function ShiftHandles({
  left,
  visualWidth,
  hidden,
  shift,
  onStartResize,
  onMoveResize,
  onStopResize,
  onCancelResize,
  onStartCopy,
  onMoveCopy,
  onStopCopy,
  onCancelCopy,
}: ShiftHandlesProps) {
  const verticalHandleLength = Math.min(40, visualWidth)
  const visibilityClass = hidden ? "opacity-0" : "opacity-0 group-hover:opacity-100"

  return (
    <>
      <span
        className={`pointer-events-auto absolute top-3 z-40 h-10 w-2 cursor-ew-resize rounded-l-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${visibilityClass}`}
        style={{ left }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => onStartResize(shift, "start", event)}
        onPointerMove={onMoveResize}
        onPointerUp={onStopResize}
        onPointerCancel={onCancelResize}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-auto absolute top-3 z-40 h-10 w-2 cursor-ew-resize rounded-r-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${visibilityClass}`}
        style={{ left: left + visualWidth - 8 }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => onStartResize(shift, "end", event)}
        onPointerMove={onMoveResize}
        onPointerUp={onStopResize}
        onPointerCancel={onCancelResize}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-auto absolute top-2 z-40 h-2 cursor-ns-resize rounded-t-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${visibilityClass}`}
        style={{
          left: left + (visualWidth - verticalHandleLength) / 2,
          width: verticalHandleLength,
        }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => onStartCopy(shift, event)}
        onPointerMove={onMoveCopy}
        onPointerUp={onStopCopy}
        onPointerCancel={onCancelCopy}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-auto absolute top-12 z-40 h-2 cursor-ns-resize rounded-b-md bg-foreground/10 transition hover:bg-foreground/20 active:bg-foreground/25 ${visibilityClass}`}
        style={{
          left: left + (visualWidth - verticalHandleLength) / 2,
          width: verticalHandleLength,
        }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => onStartCopy(shift, event)}
        onPointerMove={onMoveCopy}
        onPointerUp={onStopCopy}
        onPointerCancel={onCancelCopy}
        aria-hidden="true"
      />
    </>
  )
}
