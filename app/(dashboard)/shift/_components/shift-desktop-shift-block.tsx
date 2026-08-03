import type { KeyboardEvent } from "react"
import type { Shift } from "@/lib/shift-data"
import { ShiftHandles } from "./shift-handles"
import { useShiftHandleHover } from "./shift-handle-hover"
import { ShiftSplitTimeLabels } from "./shift-split-time-labels"
import { formatTime, shouldSplitShiftTimeLabels, SLOT_MINUTES, START_MINUTES } from "./shift-domain"
import { SLOT_WIDTH, TIMELINE_PADDING_WIDTH } from "./shift-layout"
import type { ShiftDesktopViewProps } from "./shift-desktop-view"

type ShiftBlockInteractions = Pick<
  ShiftDesktopViewProps,
  | "moving"
  | "resizing"
  | "copying"
  | "copyingShift"
  | "editable"
  | "templates"
  | "getTemplateColor"
  | "onOpenShift"
  | "onStartMovePress"
  | "onUpdateMovePress"
  | "onMoveShift"
  | "onStopMove"
  | "onCancelMovePress"
  | "onCancelMove"
  | "onStartResize"
  | "onMoveResize"
  | "onStopResize"
  | "onCancelResize"
  | "onStartCopy"
  | "onMoveCopy"
  | "onStopCopy"
  | "onCancelCopy"
>

type ShiftDesktopShiftBlockProps = ShiftBlockInteractions & {
  memberId: string
  memberName: string
  shift: Shift
  movingPreviewShift: Shift | null
}

export function ShiftDesktopShiftBlock({
  memberId,
  memberName,
  shift,
  movingPreviewShift,
  moving,
  resizing,
  copying,
  copyingShift,
  editable,
  templates,
  getTemplateColor,
  onOpenShift,
  onStartMovePress,
  onUpdateMovePress,
  onMoveShift,
  onStopMove,
  onCancelMovePress,
  onCancelMove,
  onStartResize,
  onMoveResize,
  onStopResize,
  onCancelResize,
  onStartCopy,
  onMoveCopy,
  onStopCopy,
  onCancelCopy,
}: ShiftDesktopShiftBlockProps) {
  const left = TIMELINE_PADDING_WIDTH + ((shift.start - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
  const visualWidth = ((shift.end - shift.start) / SLOT_MINUTES) * SLOT_WIDTH + 1
  const template = templates[shift.templateId]
  const isSingleSlotShift = shift.end - shift.start === SLOT_MINUTES
  const isMovingShift = moving?.id === shift.id
  const isResizingShift = resizing?.id === shift.id
  const isEditingShift = isMovingShift || isResizingShift
  const hasSplitEditingTimes = isEditingShift && shouldSplitShiftTimeLabels(shift.start, shift.end)
  const adjustsConflictingShifts = isResizingShift && (resizing?.adjustedShiftIds.length ?? 0) > 0
  const isMovingAlias = isMovingShift && movingPreviewShift?.memberId !== shift.memberId
  const isMovingSource = isMovingShift && !isMovingAlias
  const isMovingSourceAlias = isMovingSource && moving?.previewMemberId === shift.memberId
  const isHiddenMovingSource = isMovingSource && !isMovingSourceAlias
  const isCopyingAlias =
    copying?.sourceId === shift.id
    && copying.previewMemberIds.includes(memberId)
    && copyingShift?.memberId !== memberId
  const isCopyingSource = copying?.sourceId === shift.id && !isCopyingAlias
  const isInteractionAlias = isMovingAlias || isCopyingAlias
  const handleHover = useShiftHandleHover(shift.id)

  return (
    <div className="contents">
      <div
        data-shift-block
        data-shift-block-id={shift.id}
        data-copy-preview={isCopyingAlias ? "true" : undefined}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isInteractionAlias) onOpenShift(shift.id)
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onOpenShift(shift.id)
          }
        }}
        onPointerDown={(event) => {
          if (!isInteractionAlias) onStartMovePress(shift, event)
        }}
        onPointerOver={handleHover.onPointerOver}
        onPointerOut={handleHover.onPointerOut}
        onPointerMove={(event) => {
          onUpdateMovePress(event)
          onMoveShift(event)
          onMoveResize(event)
        }}
        onPointerUp={() => {
          onCancelMovePress()
          onStopMove()
          onStopResize()
        }}
        onPointerCancel={() => {
          onCancelMovePress()
          onCancelMove()
          onCancelResize()
        }}
        aria-label={`${memberName} ${formatTime(shift.start)}-${formatTime(shift.end)}の詳細`}
        className={`${isInteractionAlias ? "pointer-events-none" : "pointer-events-auto"} absolute top-2 box-border h-12 select-none rounded-md border text-left transition hover:z-30 hover:ring-2 hover:ring-inset hover:ring-ring/40 ${hasSplitEditingTimes || adjustsConflictingShifts ? "overflow-visible" : "overflow-hidden"} ${isHiddenMovingSource ? "opacity-0" : ""} ${isMovingAlias || isMovingSourceAlias || isCopyingAlias ? "opacity-40 ring-2 ring-inset ring-ring/30" : ""} ${isSingleSlotShift ? "px-0" : "px-3 shadow-sm"} ${editable && !isInteractionAlias ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
        style={{
          left,
          width: visualWidth,
          minWidth: visualWidth,
          maxWidth: visualWidth,
          ...getTemplateColor(shift.templateId).blockStyle,
        }}
      >
        {hasSplitEditingTimes ? (
          <ShiftSplitTimeLabels
            start={shift.start}
            end={shift.end}
          />
        ) : isSingleSlotShift ? null : (
          <>
            <span className="block select-none truncate text-sm font-medium">
              {formatTime(shift.start)}-{formatTime(shift.end)}
            </span>
            <span className="block select-none truncate text-xs opacity-80">
              {shift.note || template.label}
            </span>
          </>
        )}
        {adjustsConflictingShifts ? (
          <span className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border border-amber-500/40 bg-background px-2 py-1.5 text-xs text-amber-700 shadow-sm">
            他のシフトの時間帯が変更される可能性があります。
          </span>
        ) : null}
      </div>
      {editable && !isInteractionAlias ? (
        <ShiftHandles
          left={left}
          visualWidth={visualWidth}
          visible={handleHover.hovered && !isMovingShift && !isCopyingSource}
          shift={shift}
          onPointerOver={handleHover.onPointerOver}
          onPointerOut={handleHover.onPointerOut}
          onStartResize={onStartResize}
          onMoveResize={onMoveResize}
          onStopResize={onStopResize}
          onCancelResize={onCancelResize}
          onStartCopy={onStartCopy}
          onMoveCopy={onMoveCopy}
          onStopCopy={onStopCopy}
          onCancelCopy={onCancelCopy}
        />
      ) : null}
    </div>
  )
}
