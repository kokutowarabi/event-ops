import type { MouseEvent, PointerEvent } from "react"
import { ListFilter, Pin } from "lucide-react"
import type { Member } from "@/lib/members"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { Button } from "@/components/ui/button"
import { ShiftFilterEmptyState } from "./shift-filter-ui"
import type { ShiftTemplateColor } from "./shift-domain"
import {
  ShiftMobileMember,
  type MobileCreatePreview,
} from "./shift-mobile-member"

type ShiftMobileViewProps = {
  visible: boolean
  filterSummary: string
  filtersOpen: boolean
  hasNoFilterResults: boolean
  pinnedMembers: Member[]
  members: Member[]
  pinnedMemberIds: Set<string>
  selectedDateShifts: Shift[]
  visibleDateShifts: Shift[]
  hoveredSlot: { memberId: string; slot: number } | null
  editable: boolean
  templates: Record<ShiftTemplateId, ShiftTemplate>
  getTemplateColor: (templateId: ShiftTemplateId) => ShiftTemplateColor
  getCreatePreview: (memberId: string) => MobileCreatePreview | null
  onToggleFilters: (event: MouseEvent<HTMLButtonElement>) => void
  onTogglePin: (memberId: string) => void
  onBeginCreate: (memberId: string, event: PointerEvent<HTMLButtonElement>) => void
  onMoveCreate: (memberId: string, event: PointerEvent<HTMLButtonElement>) => void
  onFinishCreate: (memberId: string) => void
  onCancelCreate: () => void
  onLeaveTimeline: (memberId: string) => void
  onClearHover: () => void
  onOpenShift: (shiftId: string) => void
}

export function ShiftMobileView({
  visible,
  filterSummary,
  filtersOpen,
  hasNoFilterResults,
  pinnedMembers,
  members,
  pinnedMemberIds,
  selectedDateShifts,
  visibleDateShifts,
  hoveredSlot,
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
}: ShiftMobileViewProps) {
  return (
    <div className={`${visible ? "space-y-3 md:hidden" : "hidden"} min-h-0 flex-1 overflow-auto select-none`}>
      <Button
        type="button"
        variant="outline"
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
      {pinnedMembers.length > 0 ? (
        <div className="sticky top-0 z-30 rounded-lg border bg-card/95 p-2 shadow-sm backdrop-blur">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">ピン留め</div>
          <div className="flex flex-wrap gap-1.5">
            {pinnedMembers.map((member) => (
              <Button
                key={`mobile-pinned-${member.id}`}
                type="button"
                size="xs"
                variant="secondary"
                aria-label={`${member.name}のピン留めを解除`}
                onClick={() => onTogglePin(member.id)}
              >
                <Pin className="size-3 fill-current" />
                {member.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {hasNoFilterResults ? (
        <ShiftFilterEmptyState className="rounded-lg border bg-card" />
      ) : null}
      {members.map((member) => (
        <ShiftMobileMember
          key={`mobile-member-${member.id}`}
          member={member}
          pinned={pinnedMemberIds.has(member.id)}
          selectedDateShifts={selectedDateShifts}
          visibleDateShifts={visibleDateShifts}
          hoveredSlot={
            hoveredSlot?.memberId === member.id ? hoveredSlot.slot : null
          }
          editable={editable}
          templates={templates}
          createPreview={getCreatePreview(member.id)}
          getTemplateColor={getTemplateColor}
          onTogglePin={() => onTogglePin(member.id)}
          onBeginCreate={(event) => onBeginCreate(member.id, event)}
          onMoveCreate={(event) => onMoveCreate(member.id, event)}
          onFinishCreate={() => onFinishCreate(member.id)}
          onCancelCreate={onCancelCreate}
          onLeaveTimeline={() => onLeaveTimeline(member.id)}
          onClearHover={onClearHover}
          onOpenShift={onOpenShift}
        />
      ))}
    </div>
  )
}
