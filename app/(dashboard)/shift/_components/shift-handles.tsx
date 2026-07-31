import type { PointerEvent } from "react"
import { GripHorizontal, GripVertical } from "lucide-react"
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
        className={`pointer-events-auto absolute top-2 z-40 grid h-12 w-4 cursor-ew-resize place-items-center rounded-l-md text-foreground/45 transition hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
        style={{ left }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => onStartResize(shift, "start", event)}
        onPointerMove={onMoveResize}
        onPointerUp={onStopResize}
        onPointerCancel={onCancelResize}
        aria-hidden="true"
      >
        <GripVertical className="size-4" />
      </span>
      <span
        className={`pointer-events-auto absolute top-2 z-40 grid h-12 w-4 cursor-ew-resize place-items-center rounded-r-md text-foreground/45 transition hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
        style={{ left: left + visualWidth - 16 }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => onStartResize(shift, "end", event)}
        onPointerMove={onMoveResize}
        onPointerUp={onStopResize}
        onPointerCancel={onCancelResize}
        aria-hidden="true"
      >
        <GripVertical className="size-4" />
      </span>
      <span
        className={`pointer-events-auto absolute top-2 z-40 grid h-4 cursor-ns-resize place-items-center rounded-t-md text-foreground/45 transition hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
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
      >
        <GripHorizontal className="size-4" />
      </span>
      <span
        className={`pointer-events-auto absolute top-10 z-40 grid h-4 cursor-ns-resize place-items-center rounded-b-md text-foreground/45 transition hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
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
      >
        <GripHorizontal className="size-4" />
      </span>
    </>
  )
}
