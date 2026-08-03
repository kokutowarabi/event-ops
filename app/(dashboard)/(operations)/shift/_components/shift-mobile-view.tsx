import type { MouseEvent } from "react"
import { ListFilter, Pin } from "lucide-react"
import { MobileCardSection } from "@/components/common/mobile-card-section"
import type { Member } from "@/lib/members"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { Button } from "@/components/ui/button"
import { ShiftFilterEmptyState } from "./shift-filter-ui"
import type { ShiftTemplateColor } from "./shift-domain"
import { ShiftMobileMember } from "./shift-mobile-member"

export function groupShiftMembersByDepartment(members: Member[]) {
  const groups = new Map<string, Member[]>()
  members.forEach((member) => {
    const department = member.department || "所属未設定"
    groups.set(department, [...(groups.get(department) ?? []), member])
  })
  return Array.from(groups, ([department, groupedMembers]) => ({
    department,
    members: groupedMembers,
  }))
}

type ShiftMobileViewProps = {
  visible: boolean
  filterSummary: string
  filtersOpen: boolean
  hasNoFilterResults: boolean
  pinnedMembers: Member[]
  members: Member[]
  memberMemos: Record<string, string>
  pinnedMemberIds: Set<string>
  selectedDateShifts: Shift[]
  visibleDateShifts: Shift[]
  editable: boolean
  templates: Record<ShiftTemplateId, ShiftTemplate>
  getTemplateColor: (templateId: ShiftTemplateId) => ShiftTemplateColor
  onToggleFilters: (event: MouseEvent<HTMLButtonElement>) => void
  onTogglePin: (memberId: string) => void
  onMemberMemoChange: (memberId: string, memo: string) => void
  onCreateAt: (memberId: string, start: number) => void
  onOpenShift: (shiftId: string) => void
}

export function ShiftMobileView({
  visible,
  filterSummary,
  filtersOpen,
  hasNoFilterResults,
  pinnedMembers,
  members,
  memberMemos,
  pinnedMemberIds,
  selectedDateShifts,
  visibleDateShifts,
  editable,
  templates,
  getTemplateColor,
  onToggleFilters,
  onTogglePin,
  onMemberMemoChange,
  onCreateAt,
  onOpenShift,
}: ShiftMobileViewProps) {
  const memberGroups = groupShiftMembersByDepartment(members)

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
      <div className="space-y-5 pb-4">
        {memberGroups.map((group) => (
          <MobileCardSection
            key={group.department}
            title={group.department}
            titleId={`shift-mobile-department-${group.department}`}
            headerClassName="px-1"
          >
            {group.members.map((member) => (
              <ShiftMobileMember
                key={`mobile-member-${member.id}`}
                member={member}
                memo={memberMemos[member.id] ?? ""}
                pinned={pinnedMemberIds.has(member.id)}
                selectedDateShifts={selectedDateShifts}
                visibleDateShifts={visibleDateShifts}
                editable={editable}
                templates={templates}
                getTemplateColor={getTemplateColor}
                onTogglePin={() => onTogglePin(member.id)}
                onMemoChange={(memo) => onMemberMemoChange(member.id, memo)}
                onCreateAt={(start) => onCreateAt(member.id, start)}
                onOpenShift={onOpenShift}
              />
            ))}
          </MobileCardSection>
        ))}
      </div>
    </div>
  )
}
