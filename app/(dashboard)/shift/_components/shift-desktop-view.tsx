import type { MouseEvent, PointerEvent } from "react"
import { ListFilter } from "lucide-react"
import type { Member } from "@/lib/members"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { Button } from "@/components/ui/button"
import { ShiftDesktopMemberRow } from "./shift-desktop-member-row"
import { ShiftFilterEmptyState } from "./shift-filter-ui"
import {
  START_MINUTES,
  timeOptions,
  type ShiftTemplateColor,
} from "./shift-domain"
import {
  SLOT_WIDTH,
  TIMELINE_PADDING_WIDTH,
  TIMELINE_TRACK_WIDTH,
} from "./shift-layout"
import type { CopyingShift, CreatingShift, MovingShift, ResizeEdge, ResizingShift } from "./shift-types"

type DesktopCreatePreview = {
  left: number
  width: number
  start: number
  end: number
  adjustsConflictingShifts: boolean
}

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
    <div className={`${visible ? "hidden md:block" : "hidden"} min-h-0 flex-1 select-none overflow-auto rounded-lg border bg-card`}>
      <div className="grid min-w-300 grid-cols-[15rem_1fr]">
        <div className="sticky left-0 top-0 z-30 flex h-16 items-center border-b border-r bg-card px-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full min-w-0 justify-start"
            onClick={onToggleFilters}
            title={filterSummary || "絞り込み"}
            aria-expanded={filtersOpen}
          >
            <ListFilter className="size-4" />
            <span className="shrink-0">絞り込み</span>
            {filterSummary ? (
              <span className="min-w-0 truncate border-l pl-2 text-xs font-normal text-muted-foreground">
                {filterSummary}
              </span>
            ) : null}
          </Button>
        </div>
        <div className="sticky top-0 z-20 flex h-16 items-center border-b bg-card">
          <div className="relative h-full" style={{ width: TIMELINE_TRACK_WIDTH }}>
            {timeOptions.map((slot, index) => {
              const isMajor = (slot.minutes - START_MINUTES) % 120 === 0
              const isHovered =
                creatingShift === null
                && moving === null
                && resizing === null
                && hoveredSlot?.slot === index
              return (
                <span
                  key={`time-slot-${slot.value}`}
                  className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs transition ${isHovered
                    ? "font-semibold text-foreground opacity-100"
                    : isMajor
                      ? "text-muted-foreground opacity-100"
                      : "text-muted-foreground opacity-0"
                  }`}
                  style={{ left: TIMELINE_PADDING_WIDTH + index * SLOT_WIDTH }}
                >
                  {slot.label}
                </span>
              )
            })}
          </div>
        </div>

        {members.map((member) => (
          <ShiftDesktopMemberRow
            key={`member-row-${member.id}`}
            member={member}
            pinned={pinnedMemberIdSet.has(member.id)}
            pinnedIndex={pinnedMemberIds.indexOf(member.id)}
            selectedDateShifts={selectedDateShifts}
            visibleDateShifts={visibleDateShifts}
            hoveredSlot={hoveredSlot}
            creatingShift={creatingShift}
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
