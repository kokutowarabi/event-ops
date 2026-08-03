import { useMemo, useState } from "react"
import { downloadCsv } from "@/lib/csv"
import type { EventOrganization } from "@/lib/event-data"
import { matchesSelectedValues } from "@/lib/table-filters"
import {
  emptyOrganization,
  type OrganizationSortKey,
  type OrganizationSortOrder,
} from "./organization-config"

type OrganizationChangeHandler = (
  organizations:
    | EventOrganization[]
    | ((current: EventOrganization[]) => EventOrganization[]),
) => void

export function useOrganizationTable(
  organizations: EventOrganization[],
  onOrganizationsChange: OrganizationChangeHandler,
) {
  const [filters, setFilters] = useState<
    Record<OrganizationSortKey, string[]>
  >({
    name: [],
    category: [],
    department: [],
    representative: [],
    contact: [],
    status: [],
    booth: [],
    note: [],
  })
  const [sortKey, setSortKey] = useState<OrganizationSortKey>("name")
  const [sortOrder, setSortOrder] = useState<OrganizationSortOrder>("asc")
  const [draft, setDraft] = useState(emptyOrganization)
  const [adding, setAdding] = useState(false)

  const headerOptions = useMemo(
    () => ({
      name: organizations.map((organization) => organization.name),
      category: organizations.map((organization) => organization.category),
      department: organizations.map((organization) => organization.department),
      representative: organizations.map(
        (organization) => organization.representative,
      ),
      booth: organizations.map((organization) => organization.booth),
      status: organizations.map((organization) => organization.status),
      note: organizations.map((organization) => organization.note),
    }),
    [organizations],
  )

  const visibleOrganizations = useMemo(
    () =>
      organizations
        .filter((organization) =>
          (Object.keys(filters) as OrganizationSortKey[]).every((key) =>
            matchesSelectedValues([organization[key]], filters[key]),
          ),
        )
        .sort((left, right) => {
          const result = left[sortKey].localeCompare(right[sortKey], "ja")
          return sortOrder === "asc" ? result : -result
        }),
    [filters, organizations, sortKey, sortOrder],
  )

  const updateFilter = (key: OrganizationSortKey, value: string[]) =>
    setFilters((current) => ({ ...current, [key]: value }))

  const updateOrganization = (
    id: string,
    update: Partial<Omit<EventOrganization, "id">>,
  ) => {
    onOrganizationsChange((current) =>
      current.map((organization) =>
        organization.id === id ? { ...organization, ...update } : organization,
      ),
    )
  }

  const toggleSort = (key: OrganizationSortKey) => {
    if (sortKey === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const addOrganization = () => {
    if (!draft.name.trim()) return
    onOrganizationsChange((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        ...draft,
        name: draft.name.trim(),
        representative: draft.representative.trim(),
        contact: draft.contact.trim(),
        booth: draft.booth.trim(),
        note: draft.note.trim(),
      },
    ])
    setDraft(emptyOrganization)
    setAdding(false)
  }

  const exportOrganizations = () =>
    downloadCsv(
      "参加団体",
      ["参加団体名", "種別", "部門", "代表者", "連絡先", "配置", "状態", "メモ"],
      visibleOrganizations.map((organization) => [
        organization.name,
        organization.category,
        organization.department,
        organization.representative,
        organization.contact,
        organization.booth,
        organization.status,
        organization.note,
      ]),
    )

  return {
    filters,
    sortKey,
    sortOrder,
    draft,
    adding,
    headerOptions,
    visibleOrganizations,
    setDraft,
    setAdding,
    updateFilter,
    updateOrganization,
    toggleSort,
    addOrganization,
    exportOrganizations,
  }
}
