import type { Member } from "@/lib/members"
import type { Shift } from "@/lib/shift-data"
import { ShiftDesktopCreatePreview } from "./shift-desktop-create-preview"
import { ShiftDesktopMemberInfo } from "./shift-desktop-member-info"
import { ShiftDesktopShiftBlock } from "./shift-desktop-shift-block"
import { DEFAULT_SHIFT_TEMPLATE_ID, SLOT_MINUTES, START_MINUTES } from "./shift-domain"
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
  | "creatingShift"
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
    copyingShift && copying?.previewMemberIds.includes(member.id) && copyingShift.memberId !== member.id
      ? [...movingMemberShifts, { ...copyingShift, memberId: member.id }]
      : movingMemberShifts
  const createPreview = getCreatePreview(member.id)

  return (
    <div className="contents">
      <ShiftDesktopMemberInfo
        member={member}
        pinned={pinned}
        top={pinnedTop}
        onTogglePin={onTogglePin}
      />
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
            className="absolute inset-y-0 rounded-lg border border-dashed border-border/80 text-left enabled:cursor-copy disabled:cursor-default"
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
          <ShiftDesktopCreatePreview
            preview={createPreview}
            templateLabel={templates[DEFAULT_SHIFT_TEMPLATE_ID].label}
            blockStyle={getTemplateColor(DEFAULT_SHIFT_TEMPLATE_ID).blockStyle}
          />
        </div>
        <div className="pointer-events-none relative -mt-16 h-16" style={{ width: TIMELINE_TRACK_WIDTH }}>
          {visibleMemberShifts.map((shift) => (
            <ShiftDesktopShiftBlock
              key={`${shift.id}-${shift.memberId}`}
              memberId={member.id}
              memberName={member.name}
              shift={shift}
              movingPreviewShift={movingPreviewShift}
              moving={moving}
              resizing={resizing}
              copying={copying}
              copyingShift={copyingShift}
              editable={editable}
              templates={templates}
              getTemplateColor={getTemplateColor}
              onOpenShift={onOpenShift}
              onStartMovePress={onStartMovePress}
              onUpdateMovePress={onUpdateMovePress}
              onMoveShift={onMoveShift}
              onStopMove={onStopMove}
              onCancelMovePress={onCancelMovePress}
              onCancelMove={onCancelMove}
              onStartResize={onStartResize}
              onMoveResize={onMoveResize}
              onStopResize={onStopResize}
              onCancelResize={onCancelResize}
              onStartCopy={onStartCopy}
              onMoveCopy={onMoveCopy}
              onStopCopy={onStopCopy}
              onCancelCopy={onCancelCopy}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
