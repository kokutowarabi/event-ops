import type { CSSProperties } from "react"
import { ShiftCreateTimeLabel } from "./shift-create-time-label"
import { formatTime, shouldSplitShiftTimeLabels } from "./shift-domain"
import { SLOT_WIDTH } from "./shift-layout"

export type DesktopCreatePreview = {
  left: number
  width: number
  start: number
  end: number
  adjustsConflictingShifts: boolean
}

type ShiftDesktopCreatePreviewProps = {
  preview: DesktopCreatePreview | null
  templateLabel: string
  blockStyle: CSSProperties
}

export function ShiftDesktopCreatePreview({
  preview,
  templateLabel,
  blockStyle,
}: ShiftDesktopCreatePreviewProps) {
  if (!preview) return null

  return (
    <div
      className={`pointer-events-none absolute top-2 z-50 box-border h-12 overflow-visible rounded-md border text-left ${preview.width === SLOT_WIDTH ? "px-0" : "px-3 shadow-sm"}`}
      style={{
        left: preview.left,
        width: preview.width,
        minWidth: preview.width,
        maxWidth: preview.width,
        ...blockStyle,
      }}
    >
      {shouldSplitShiftTimeLabels(preview.start, preview.end) ? (
        <>
          <span className="absolute -top-3 right-full mr-2 whitespace-nowrap text-sm font-medium">
            {formatTime(preview.start)}
          </span>
          <span className="absolute -top-3 left-full ml-2 whitespace-nowrap text-sm font-medium">
            {formatTime(preview.end)}
          </span>
        </>
      ) : (
        <div className="absolute left-1 top-1 z-10">
          <ShiftCreateTimeLabel
            start={preview.start}
            end={preview.end}
            orientation="horizontal"
          />
        </div>
      )}
      {preview.width > SLOT_WIDTH ? (
        <span className="absolute left-1 top-7 block truncate text-xs opacity-80">
          {templateLabel}
        </span>
      ) : null}
      {preview.adjustsConflictingShifts ? (
        <span className="absolute left-0 top-full mt-2 w-72 rounded-md border border-amber-500/40 bg-background px-2 py-1.5 text-xs text-amber-700 shadow-sm">
          他のシフトの時間帯が変更される可能性があります。
        </span>
      ) : null}
    </div>
  )
}
