import type { Dispatch, SetStateAction } from "react"
import { MobileCardSection } from "@/components/common/mobile-card-section"
import type { Member, SortKey } from "@/lib/members"
import { RosterMobileDraftCard, RosterMobileMemberCard } from "./roster-mobile-card"
import { RosterMobileFilters } from "./roster-mobile-filters"
import type { RosterFilters } from "./roster-types"

export function groupMembersByDepartment(members: Member[]) {
  const groups = new Map<string, Member[]>()
  members.forEach((member) => {
    const key = member.department || "所属未設定"
    groups.set(key, [...(groups.get(key) ?? []), member])
  })
  return Array.from(groups, ([department, groupedMembers]) => ({ department, members: groupedMembers }))
}

type RosterMobileViewProps = {
  members: Member[]
  adding: boolean
  draft: Omit<Member, "id">
  filtersOpen: boolean
  query: string
  filters: RosterFilters
  departments: string[]
  roles: string[]
  onDraftChange: Dispatch<SetStateAction<Omit<Member, "id">>>
  onFiltersOpenChange: (open: boolean) => void
  onQueryChange: (query: string) => void
  onFilterChange: (key: SortKey, value: string[]) => void
  onClearFilters: () => void
  onEditMember: (member: Member) => void
  onDeleteMember: (id: string) => void
}

export function RosterMobileView({
  members,
  adding,
  draft,
  filtersOpen,
  query,
  filters,
  departments,
  roles,
  onDraftChange,
  onFiltersOpenChange,
  onQueryChange,
  onFilterChange,
  onClearFilters,
  onEditMember,
  onDeleteMember,
}: RosterMobileViewProps) {
  const groups = groupMembersByDepartment(members)

  return (
    <div className="md:hidden">
      <RosterMobileFilters
        open={filtersOpen}
        query={query}
        filters={filters}
        departments={departments}
        roles={roles}
        visibleCount={members.length}
        onOpenChange={onFiltersOpenChange}
        onQueryChange={onQueryChange}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
      />
      {adding ? (
        <RosterMobileDraftCard
          draft={draft}
          departments={departments}
          roles={roles}
          onDraftChange={onDraftChange}
        />
      ) : null}
      {groups.length === 0 ? (
        <div className="grid min-h-48 place-items-center px-4 text-sm text-muted-foreground">
          該当するメンバーがいません。
        </div>
      ) : (
        <div className="space-y-5 py-4">
          {groups.map((group) => (
            <MobileCardSection
              key={group.department}
              title={group.department}
              titleId={`mobile-department-${group.department}`}
              scrollerClassName="px-4"
            >
              {group.members.map((member) => (
                <RosterMobileMemberCard
                  key={member.id}
                  member={member}
                  onEdit={() => onEditMember(member)}
                  onDelete={() => onDeleteMember(member.id)}
                />
              ))}
            </MobileCardSection>
          ))}
        </div>
      )}
    </div>
  )
}
