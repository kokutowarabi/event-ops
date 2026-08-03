import type { MouseEvent, PointerEvent } from "react"
import type { Member } from "@/lib/members"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { ShiftDesktopMemberRow } from "./shift-desktop-member-row"
import { ShiftDesktopTimelineHeader } from "./shift-desktop-timeline-header"
import { ShiftFilterEmptyState } from "./shift-filter-ui"
import type { ShiftTemplateColor } from "./shift-domain"
import type { CopyingShift, CreatingShift, MovingShift, ResizeEdge, ResizingShift } from "./shift-types"
import type { DesktopCreatePreview } from "./shift-desktop-create-preview"

export type ShiftDesktopViewProps = {
  visible: boolean
  filterSummary: string
  filtersOpen: boolean
  hasNoFilterResults: boolean
  members: Member[]
  pinnedMemberIds: string[]
  pinnedMemberIdSet: Set<string>
  selectedDateShifts: Shift[]
  visibleDateShifts: Shift[]
  hoveredSlot: { memberId: string; slot: number } | null
  creatingShift: CreatingShift | null
  moving: MovingShift | null
  resizing: ResizingShift | null
  copying: CopyingShift | null
  copyingShift: Shift | null
  editable: boolean
  templates: Record<ShiftTemplateId, ShiftTemplate>
  getTemplateColor: (templateId: ShiftTemplateId) => ShiftTemplateColor
  getCreatePreview: (memberId: string) => DesktopCreatePreview | null
  onToggleFilters: (event: MouseEvent<HTMLButtonElement>) => void
  onTogglePin: (memberId: string) => void
  onBeginCreate: (memberId: string, event: PointerEvent<HTMLButtonElement>) => void
  onMoveCreate: (memberId: string, event: PointerEvent<HTMLButtonElement>) => void
  onFinishCreate: (memberId: string) => void
  onCancelCreate: () => void
  onLeaveTimeline: (memberId: string) => void
  onClearHover: () => void
  onOpenShift: (shiftId: string) => void
  onStartMovePress: (shift: Shift, event: PointerEvent<HTMLDivElement>) => void
  onUpdateMovePress: (event: PointerEvent<HTMLDivElement>) => void
  onMoveShift: (event: PointerEvent<HTMLDivElement>) => void
  onStopMove: () => void
  onCancelMovePress: () => void
  onCancelMove: () => void
  onStartResize: (shift: Shift, edge: ResizeEdge, event: PointerEvent<HTMLSpanElement>) => void
  onMoveResize: (event: PointerEvent<HTMLElement>) => void
  onStopResize: () => void
  onCancelResize: () => void
  onStartCopy: (shift: Shift, event: PointerEvent<HTMLSpanElement>) => void
  onMoveCopy: (event: PointerEvent<HTMLSpanElement>) => void
  onStopCopy: () => void
  onCancelCopy: () => void
}

export function ShiftDesktopView({
  visible,
  filterSummary,
  filtersOpen,
  hasNoFilterResults,
  members,
  pinnedMemberIds,
  pinnedMemberIdSet,
  selectedDateShifts,
  visibleDateShifts,
  hoveredSlot,
  creatingShift,
  moving,
  resizing,
  copying,
  copyingShift,
  editable,
  templates,
  getTemplateColor,
  getCreatePreview,
  onToggleFilters,
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
}: ShiftDesktopViewProps) {
  const movingPreviewShift = moving
    ? selectedDateShifts.find((shift) => shift.id === moving.id) ?? null
    : null

  return (
    <div
      data-shift-scroll-container
      className={`${visible ? "hidden md:block" : "hidden"} min-h-0 flex-1 select-none overflow-auto rounded-lg border bg-card`}
    >
      <div className="grid min-w-300 grid-cols-[15rem_1fr]">
        <ShiftDesktopTimelineHeader
          filterSummary={filterSummary}
          filtersOpen={filtersOpen}
          hoveredSlot={hoveredSlot}
          creatingShift={creatingShift}
          moving={moving}
          resizing={resizing}
          onToggleFilters={onToggleFilters}
        />

        {members.map((member) => (
          <ShiftDesktopMemberRow
            key={`member-row-${member.id}`}
            member={member}
            pinned={pinnedMemberIdSet.has(member.id)}
            pinnedIndex={pinnedMemberIds.indexOf(member.id)}
            selectedDateShifts={selectedDateShifts}
            visibleDateShifts={visibleDateShifts}
            hoveredSlot={hoveredSlot}
            moving={moving}
            resizing={resizing}
            copying={copying}
            movingPreviewShift={movingPreviewShift}
            copyingShift={copyingShift}
            editable={editable}
            templates={templates}
            getTemplateColor={getTemplateColor}
            getCreatePreview={getCreatePreview}
            onTogglePin={onTogglePin}
            onBeginCreate={onBeginCreate}
            onMoveCreate={onMoveCreate}
            onFinishCreate={onFinishCreate}
            onCancelCreate={onCancelCreate}
            onLeaveTimeline={onLeaveTimeline}
            onClearHover={onClearHover}
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
      {hasNoFilterResults ? (
        <ShiftFilterEmptyState className="sticky left-0 min-h-40 w-full border-b" />
      ) : null}
    </div>
  )
}
