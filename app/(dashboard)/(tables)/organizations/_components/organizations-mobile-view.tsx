import type { Dispatch, SetStateAction } from "react"
import { MobileCardSection } from "@/components/common/mobile-card-section"
import type { EventOrganization } from "@/lib/event-data"
import { OrganizationMobileCard, OrganizationMobileDraftCard } from "./organization-mobile-card"

export function groupOrganizationsByDepartment(organizations: EventOrganization[]) {
  const groups = new Map<string, EventOrganization[]>()
  organizations.forEach((organization) => {
    const key = organization.department || "部門未設定"
    groups.set(key, [...(groups.get(key) ?? []), organization])
  })
  return Array.from(groups, ([department, groupedOrganizations]) => ({
    department,
    organizations: groupedOrganizations,
  }))
}

export function OrganizationsMobileView({
  organizations,
  adding,
  draft,
  onDraftChange,
  onUpdateOrganization,
  onDeleteOrganization,
}: {
  organizations: EventOrganization[]
  adding: boolean
  draft: Omit<EventOrganization, "id">
  onDraftChange: Dispatch<SetStateAction<Omit<EventOrganization, "id">>>
  onUpdateOrganization: (id: string, update: Partial<Omit<EventOrganization, "id">>) => void
  onDeleteOrganization: (organization: EventOrganization) => void
}) {
  const groups = groupOrganizationsByDepartment(organizations)

  return (
    <div className="md:hidden">
      {adding ? <OrganizationMobileDraftCard draft={draft} onDraftChange={onDraftChange} /> : null}
      {groups.length === 0 ? (
        <div className="grid min-h-48 place-items-center px-4 text-sm text-muted-foreground">
          該当する参加団体がいません。
        </div>
      ) : (
        <div className="space-y-5 py-4">
          {groups.map((group) => (
            <MobileCardSection
              key={group.department}
              title={group.department}
              titleId={`mobile-organization-${group.department}`}
              countLabel="団体"
              scrollerClassName="px-3"
            >
              {group.organizations.map((organization) => (
                <OrganizationMobileCard
                  key={organization.id}
                  organization={organization}
                  onUpdate={(update) => onUpdateOrganization(organization.id, update)}
                  onDelete={() => onDeleteOrganization(organization)}
                />
              ))}
            </MobileCardSection>
          ))}
        </div>
      )}
    </div>
  )
}
