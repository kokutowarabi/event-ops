import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import {
  formatTime,
  shouldSplitShiftTimeLabels,
  SLOT_MINUTES,
  type ShiftTemplateColor,
} from "./shift-domain"
import { SLOT_WIDTH } from "./shift-layout"
import { ShiftSplitTimeLabels } from "./shift-split-time-labels"
import type { CopyingShift, MovingShift } from "./shift-types"

type ShiftDragOverlaysProps = {
  moving: MovingShift | null
  movingShift: Shift | null
  copying: CopyingShift | null
  copyingShift: Shift | null
  templates: Record<ShiftTemplateId, ShiftTemplate>
  getTemplateColor: (templateId: ShiftTemplateId) => ShiftTemplateColor
}

export function ShiftDragOverlays({
  moving,
  movingShift,
  copying,
  copyingShift,
  templates,
  getTemplateColor,
}: ShiftDragOverlaysProps) {
  return (
    <>
      {moving && movingShift ? (
        <div
          className={`pointer-events-none fixed z-50 box-border h-12 select-none rounded-md border text-left opacity-90 shadow-lg ${shouldSplitShiftTimeLabels(movingShift.start, movingShift.end) ? "overflow-visible" : "overflow-hidden"} ${moving.canDrop ? "" : "ring-2 ring-destructive"} ${movingShift.end - movingShift.start === SLOT_MINUTES ? "px-0" : "px-3"}`}
          style={{
            left: moving.pointerX - moving.pointerOffsetX,
            top: moving.pointerY - 24,
            width: ((movingShift.end - movingShift.start) / SLOT_MINUTES) * SLOT_WIDTH + 1,
            ...getTemplateColor(movingShift.templateId).blockStyle,
          }}
        >
          {!moving.canDrop ? <InvalidDropIndicator size="small" /> : null}
          {shouldSplitShiftTimeLabels(movingShift.start, movingShift.end) ? (
            <ShiftSplitTimeLabels start={movingShift.start} end={movingShift.end} />
          ) : movingShift.end - movingShift.start === SLOT_MINUTES ? null : (
            <>
              <span className="block select-none truncate text-sm font-medium">
                {formatTime(movingShift.start)}-{formatTime(movingShift.end)}
              </span>
              <span className="block select-none truncate text-xs opacity-80">
                {movingShift.note || templates[movingShift.templateId]?.label}
              </span>
            </>
          )}
        </div>
      ) : null}

      {copying && copyingShift
        ? createPortal(
          <div
            className="pointer-events-none fixed z-50 rounded-md border-2 border-dashed bg-transparent opacity-60"
            style={{
              left: copying.stretchRect.left,
              top: copying.stretchRect.top,
              width: copying.stretchRect.width,
              height: copying.stretchRect.height,
              borderColor: getTemplateColor(copyingShift.templateId).blockStyle.borderColor,
            }}
            aria-hidden="true"
          />,
          document.body,
        )
        : null}
    </>
  )
}

function InvalidDropIndicator({ size }: { size: "small" }) {
  return (
    <span
      data-slot="invalid-shift-drop-indicator"
      className="absolute inset-0 z-10 grid place-items-center"
      aria-hidden="true"
    >
      <X className={size === "small" ? "size-5 text-destructive drop-shadow-sm" : "size-6 text-destructive drop-shadow-sm"} data-icon-motion="pop" strokeWidth={3} />
    </span>
  )
}
