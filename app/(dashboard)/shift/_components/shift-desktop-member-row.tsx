import type { KeyboardEvent } from "react"
import { Pin } from "lucide-react"
import type { Member } from "@/lib/members"
import type { Shift } from "@/lib/shift-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import { ShiftCreateTimeLabel } from "./shift-create-time-label"
import { ShiftHandles } from "./shift-handles"
import {
  DEFAULT_SHIFT_TEMPLATE_ID,
  formatTime,
  shouldSplitShiftTimeLabels,
  SLOT_MINUTES,
  START_MINUTES,
} from "./shift-domain"
import {
  DESKTOP_MEMBER_ROW_HEIGHT,
  DESKTOP_TIMELINE_HEADER_HEIGHT,
  getHoveredSlotRadiusClass,
  SHIFT_DND_CREATION_ENABLED,
  SLOT_WIDTH,
  TIMELINE_PADDING_WIDTH,
  TIMELINE_TRACK_WIDTH,
  TIMELINE_WIDTH,
} from "./shift-layout"
import type { ShiftDesktopViewProps } from "./shift-desktop-view"

type ShiftDesktopMemberRowProps = Omit<
  ShiftDesktopViewProps,
  | "visible"
  | "filterSummary"
  | "filtersOpen"
  | "hasNoFilterResults"
  | "members"
  | "pinnedMemberIds"
  | "pinnedMemberIdSet"
  | "onToggleFilters"
> & {
  member: Member
  pinned: boolean
  pinnedIndex: number
  movingPreviewShift: Shift | null
}

export function ShiftDesktopMemberRow({
  member,
  pinned,
  pinnedIndex,
  selectedDateShifts,
  visibleDateShifts,
  hoveredSlot,
  creatingShift,
  moving,
  resizing,
  copying,
  movingPreviewShift,
  copyingShift,
  editable,
  templates,
  getTemplateColor,
  getCreatePreview,
  onTogglePin,
  onBeginCreate,
  onMoveCreate,
  onFinishCreate,
  onCancelCreate,
  onLeaveTimeline,
  onClearHover,
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
}: ShiftDesktopMemberRowProps) {
  const pinnedTop = DESKTOP_TIMELINE_HEADER_HEIGHT + pinnedIndex * DESKTOP_MEMBER_ROW_HEIGHT
  const hoveredMemberSlot = hoveredSlot?.memberId === member.id ? hoveredSlot.slot : null
  const memberShifts = (pinned ? selectedDateShifts : visibleDateShifts)
    .filter((shift) => shift.memberId === member.id)
  const allMemberShifts = selectedDateShifts.filter((shift) => shift.memberId === member.id)
  const movingMemberShifts =
    movingPreviewShift && moving?.previewMemberId === member.id && movingPreviewShift.memberId !== member.id
      ? [...memberShifts, { ...movingPreviewShift, memberId: member.id }]
      : memberShifts
  const visibleMemberShifts =
    copyingShift && copying?.previewMemberId === member.id && copyingShift.memberId !== member.id
      ? [...movingMemberShifts, { ...copyingShift, memberId: member.id }]
      : movingMemberShifts
  const createPreview = getCreatePreview(member.id)

  return (
    <div className="contents">
      <div
        className={`sticky left-0 border-r border-b bg-card p-4 ${pinned ? "z-25 h-[88px] shadow-sm" : "z-10"}`}
        style={pinned ? { top: pinnedTop } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 font-medium">{member.name}</div>
          <Button
            type="button"
            size="icon-sm"
            variant={pinned ? "secondary" : "ghost"}
            aria-label={pinned ? `${member.name}のピン留めを解除` : `${member.name}をピン留め`}
            aria-pressed={pinned}
            onClick={() => onTogglePin(member.id)}
          >
            <Pin className={`size-4 ${pinned ? "fill-current" : ""}`} />
          </Button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Badge variant="outline" className={`font-normal ${memberDepartmentBadgeClass(member.department)}`}>
            {member.department}
          </Badge>
          <MemberRoleBadges value={member.role} />
        </div>
      </div>
      <div
        className={`border-b py-3 ${pinned ? "sticky z-15 h-[88px] bg-card shadow-sm" : ""}`}
        style={pinned ? { top: pinnedTop } : undefined}
      >
        <div className="relative h-16" style={{ width: TIMELINE_TRACK_WIDTH }}>
          <button
            type="button"
            disabled={!SHIFT_DND_CREATION_ENABLED || !editable}
            data-shift-member-id={member.id}
            onPointerDown={(event) => onBeginCreate(member.id, event)}
            onPointerMove={(event) => onMoveCreate(member.id, event)}
            onPointerUp={() => onFinishCreate(member.id)}
            onPointerCancel={onCancelCreate}
            onPointerLeave={() => onLeaveTimeline(member.id)}
            className="absolute inset-y-0 rounded-lg border border-dashed border-border/80 text-left transition enabled:cursor-copy enabled:hover:bg-muted/30 disabled:cursor-default"
            style={{
              left: TIMELINE_PADDING_WIDTH,
              width: TIMELINE_WIDTH,
              backgroundImage:
                "repeating-linear-gradient(to right, transparent 0, transparent 15px, color-mix(in oklch, var(--border), transparent 35%) 15px, color-mix(in oklch, var(--border), transparent 35%) 16px)",
            }}
            aria-label={`${member.name}のシフトを追加`}
          >
            {allMemberShifts.map((shift) => {
              const blockedLeft = ((shift.start - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
              const blockedWidth = ((shift.end - shift.start) / SLOT_MINUTES) * SLOT_WIDTH
              return (
                <span
                  key={`blocked-slot-${shift.id}`}
                  className="absolute inset-y-0 cursor-not-allowed"
                  style={{ left: blockedLeft, width: blockedWidth }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerEnter={onClearHover}
                  onPointerMove={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  aria-hidden="true"
                />
              )
            })}
            {hoveredMemberSlot !== null ? (
              <span
                className={`pointer-events-none absolute inset-y-0 border-r bg-muted ${getHoveredSlotRadiusClass(hoveredMemberSlot)}`}
                style={{
                  left: hoveredMemberSlot * SLOT_WIDTH,
                  width: SLOT_WIDTH,
                  borderRightColor: "color-mix(in oklch, var(--border), transparent 35%)",
                }}
              />
            ) : null}
          </button>
          {createPreview ? (
            <div
              className={`pointer-events-none absolute top-2 z-50 box-border h-12 overflow-visible rounded-md border text-left ${createPreview.width === SLOT_WIDTH ? "px-0" : "px-3 shadow-sm"}`}
              style={{
                left: createPreview.left,
                width: createPreview.width,
                minWidth: createPreview.width,
                maxWidth: createPreview.width,
                ...getTemplateColor(DEFAULT_SHIFT_TEMPLATE_ID).blockStyle,
              }}
            >
              {shouldSplitShiftTimeLabels(createPreview.start, createPreview.end) ? (
                <>
                  <span className="absolute -top-3 right-full mr-2 whitespace-nowrap text-sm font-medium">
                    {formatTime(createPreview.start)}
                  </span>
                  <span className="absolute -top-3 left-full ml-2 whitespace-nowrap text-sm font-medium">
                    {formatTime(createPreview.end)}
                  </span>
                </>
              ) : (
                <div className="absolute left-1 top-1 z-10">
                  <ShiftCreateTimeLabel
                    start={createPreview.start}
                    end={createPreview.end}
                    orientation="horizontal"
                  />
                </div>
              )}
              {createPreview.width > SLOT_WIDTH ? (
                <span className="absolute left-1 top-7 block truncate text-xs opacity-80">
                  {templates[DEFAULT_SHIFT_TEMPLATE_ID].label}
                </span>
              ) : null}
              {createPreview.adjustsConflictingShifts ? (
                <span className="absolute left-0 top-full mt-2 w-72 rounded-md border border-amber-500/40 bg-background px-2 py-1.5 text-xs text-amber-700 shadow-sm">
                  他のシフトの時間帯が変更される可能性があります。
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="pointer-events-none relative -mt-16 h-16" style={{ width: TIMELINE_TRACK_WIDTH }}>
          {visibleMemberShifts.map((shift) => {
            const left = TIMELINE_PADDING_WIDTH + ((shift.start - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
            const width = ((shift.end - shift.start) / SLOT_MINUTES) * SLOT_WIDTH
            const visualWidth = width + 1
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
              && copying?.previewMemberId === member.id
              && copyingShift?.memberId !== member.id
            const isCopyingSource = copying?.sourceId === shift.id && !isCopyingAlias
            const isInteractionAlias = isMovingAlias || isCopyingAlias
            return (
              <div key={`${shift.id}-${isCopyingAlias ? "copy" : "shift"}`} className="group contents">
                <div
                  data-shift-block
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
                  aria-label={`${member.name} ${formatTime(shift.start)}-${formatTime(shift.end)}の詳細`}
                  className={`${isInteractionAlias ? "pointer-events-none" : "pointer-events-auto"} absolute top-2 box-border h-12 select-none rounded-md border text-left transition hover:z-30 hover:ring-2 hover:ring-inset hover:ring-ring/40 ${hasSplitEditingTimes || adjustsConflictingShifts ? "overflow-visible" : "overflow-hidden"} ${isHiddenMovingSource ? "opacity-0" : ""} ${isMovingAlias || isMovingSourceAlias || isCopyingAlias ? "opacity-40 ring-2 ring-inset ring-ring/30" : ""} ${isCopyingAlias && !copying?.canDrop ? "ring-destructive" : ""} ${isSingleSlotShift ? "px-0" : "px-3 shadow-sm"} ${editable && !isInteractionAlias ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                  style={{
                    left,
                    width: visualWidth,
                    minWidth: visualWidth,
                    maxWidth: visualWidth,
                    ...getTemplateColor(shift.templateId).blockStyle,
                  }}
                >
                  {hasSplitEditingTimes ? (
                    <>
                      <span className="absolute -top-3 right-full mr-2 whitespace-nowrap text-sm font-medium">
                        {formatTime(shift.start)}
                      </span>
                      <span className="absolute -top-3 left-full ml-2 whitespace-nowrap text-sm font-medium">
                        {formatTime(shift.end)}
                      </span>
                    </>
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
                    hidden={isMovingShift || isCopyingSource}
                    shift={shift}
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
          })}
        </div>
      </div>
    </div>
  )
}
