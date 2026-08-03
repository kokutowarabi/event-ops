import type { PointerEvent, PointerEventHandler } from "react"
import { GripHorizontal, GripVertical } from "lucide-react"
import type { Shift } from "@/lib/shift-data"
import type { ResizeEdge } from "./shift-types"

type ShiftHandlesProps = {
  left: number
  visualWidth: number
  visible: boolean
  shift: Shift
  onPointerOver: PointerEventHandler<HTMLSpanElement>
  onPointerOut: PointerEventHandler<HTMLSpanElement>
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
  visible,
  shift,
  onPointerOver,
  onPointerOut,
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
  const visibilityClass = visible
    ? "pointer-events-auto opacity-100"
    : "pointer-events-none opacity-0"

  return (
    <>
      <span
        data-shift-handle-for={shift.id}
        data-shift-handle-edge="start"
        className={`absolute top-2 z-40 grid h-12 w-4 cursor-ew-resize place-items-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
        style={{ left: left - 8 }}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
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
        data-shift-handle-for={shift.id}
        data-shift-handle-edge="end"
        className={`absolute top-2 z-40 grid h-12 w-4 cursor-ew-resize place-items-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
        style={{ left: left + visualWidth - 8 }}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
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
        data-shift-handle-for={shift.id}
        data-shift-handle-edge="top"
        className={`absolute top-0 z-40 grid h-4 cursor-ns-resize place-items-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
        style={{
          left: left + (visualWidth - verticalHandleLength) / 2,
          width: verticalHandleLength,
        }}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
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
        data-shift-handle-for={shift.id}
        data-shift-handle-edge="bottom"
        className={`absolute top-12 z-40 grid h-4 cursor-ns-resize place-items-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/10 hover:text-foreground/70 active:bg-foreground/15 ${visibilityClass}`}
        style={{
          left: left + (visualWidth - verticalHandleLength) / 2,
          width: verticalHandleLength,
        }}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
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
