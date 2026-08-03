import { useMemo, useState } from "react"
import { Download, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { memberRoles, memberDepartments, exportToCsv, type Member, type SortKey, type SortOrder } from "@/lib/members"
import { parseMemberRoles } from "@/lib/member-role"
import { matchesSelectedValues } from "@/lib/table-filters"
import { TablePageShell } from "../../_components/table-page-shell"
import { MemberDetailDialog } from "./member-detail-dialog"
import { RosterDesktopTable } from "./roster-desktop-table"
import { RosterMobileView } from "./roster-mobile-view"
import type { RosterFilters, RosterHeaderOptions } from "./roster-types"

type RosterManagerProps = {
  members: Member[]
  departments?: string[]
  roles?: string[]
  onMembersChange: (members: Member[] | ((prev: Member[]) => Member[])) => void
  onDeleteMember: (id: string) => void
}

const emptyFilters = (): RosterFilters => ({ name: [], email: [], department: [], role: [] })

export function RosterManager({
  members,
  departments = memberDepartments,
  roles = memberRoles,
  onMembersChange,
  onDeleteMember,
}: RosterManagerProps) {
  const roleOptions = useMemo(
    () => Array.from(new Set([
      ...roles.flatMap(parseMemberRoles),
      ...members.flatMap((member) => parseMemberRoles(member.role)),
    ])).filter(Boolean),
    [members, roles],
  )
  const [filters, setFilters] = useState<RosterFilters>(emptyFilters)
  const [mobileQuery, setMobileQuery] = useState("")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [draft, setDraft] = useState<Omit<Member, "id">>({ name: "", email: "", department: departments[0] ?? "", role: roles[0] ?? "" })
  const [adding, setAdding] = useState(false)
  const [detailDraft, setDetailDraft] = useState<Member | null>(null)

  const headerOptions = useMemo<RosterHeaderOptions>(() => ({
    name: members.map((member) => member.name),
    email: members.map((member) => member.email),
    department: members.map((member) => member.department),
    role: members.flatMap((member) => parseMemberRoles(member.role)),
  }), [members])

  const visibleMembers = useMemo(() => {
    const normalizedQuery = mobileQuery.trim().toLocaleLowerCase("ja")
    return members
      .filter((member) => {
        const matchesQuery = !normalizedQuery || `${member.name} ${member.email}`.toLocaleLowerCase("ja").includes(normalizedQuery)
        const matchesFilters = (Object.keys(filters) as SortKey[]).every((key) => {
          const values = key === "role" ? parseMemberRoles(member.role) : [member[key]]
          return matchesSelectedValues(values, filters[key])
        })
        return matchesQuery && matchesFilters
      })
      .sort((left, right) => {
        const result = left[sortKey].localeCompare(right[sortKey], "ja")
        return sortOrder === "asc" ? result : -result
      })
  }, [filters, members, mobileQuery, sortKey, sortOrder])

  const updateFilter = (key: SortKey, value: string[]) =>
    setFilters((current) => ({ ...current, [key]: value }))
  const updateMember = (
    id: string,
    update: Partial<Omit<Member, "id">>,
  ) => onMembersChange((current) =>
    current.map((member) => member.id === id ? { ...member, ...update } : member),
  )
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder((current) => current === "asc" ? "desc" : "asc")
    else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }
  const addMember = () => {
    if (!draft.name.trim() || !draft.email.trim()) return
    onMembersChange((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: draft.name.trim(),
        email: draft.email.trim(),
        department: draft.department.trim(),
        role: draft.role.trim(),
      },
    ])
    setDraft({ name: "", email: "", department: departments[0] ?? "", role: roleOptions[0] ?? "" })
    setAdding(false)
  }
  const saveDetailDraft = () => {
    if (!detailDraft) return
    updateMember(detailDraft.id, {
      name: detailDraft.name.trim(),
      email: detailDraft.email.trim(),
      department: detailDraft.department,
      role: detailDraft.role,
    })
    setDetailDraft(null)
  }
  const clearFilters = () => {
    setFilters(emptyFilters())
    setMobileQuery("")
  }

  return (
    <>
      <TablePageShell
        icon={Users}
        title="名簿"
        footer={`${visibleMembers.length} 件表示中`}
        actions={(
          <>
            <Button
              type="button"
              size="sm"
              className="ml-2"
              onClick={adding ? addMember : () => setAdding(true)}
              disabled={adding && (!draft.name.trim() || !draft.email.trim())}
            >
              <Plus className="size-4" />
              {adding ? "追加を確定" : "メンバーを追加"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => exportToCsv(visibleMembers)}
              disabled={visibleMembers.length === 0}
            >
              <Download className="size-4" />
              CSV
            </Button>
          </>
        )}
      >
        <RosterMobileView
          members={visibleMembers}
          adding={adding}
          draft={draft}
          filtersOpen={mobileFiltersOpen}
          query={mobileQuery}
          filters={filters}
          departments={departments}
          roles={roleOptions}
          onDraftChange={setDraft}
          onFiltersOpenChange={setMobileFiltersOpen}
          onQueryChange={setMobileQuery}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          onEditMember={setDetailDraft}
          onDeleteMember={onDeleteMember}
        />
        <RosterDesktopTable
          members={visibleMembers}
          adding={adding}
          draft={draft}
          filters={filters}
          headerOptions={headerOptions}
          departments={departments}
          roleOptions={roleOptions}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onDraftChange={setDraft}
          onFilterChange={updateFilter}
          onSort={toggleSort}
          onUpdateMember={updateMember}
          onDeleteMember={onDeleteMember}
        />
      </TablePageShell>
      <MemberDetailDialog
        draft={detailDraft}
        departments={departments}
        roles={roleOptions}
        setDraft={setDetailDraft}
        onSave={saveDetailDraft}
        onClose={() => setDetailDraft(null)}
      />
    </>
  )
}
