import { Building2, Download, Plus } from "lucide-react"
import { TrashIcon } from "@/components/common/trash-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { EditableSelectCell, EditableTextCell } from "@/components/common/editable-cell"
import { SearchHeader, SelectHeader } from "@/components/common/table-column-header"
import { type EventDepartment, type EventOrganization, type OrganizationStatus } from "@/lib/event-data"
import { TablePageHeader } from "../../_components/table-page-header"
import { TablePageShell } from "../../_components/table-page-shell"
import {
  EVENT_DEPARTMENTS,
  ORGANIZATION_STATUSES,
  organizationStatusVariants,
} from "./organization-config"
import { OrganizationsMobileView } from "./organizations-mobile-view"
import { OrganizationLogo } from "./organization-logo"
import { useOrganizationTable } from "./use-organization-table"

type OrganizationManagerProps = {
  organizations: EventOrganization[]
  onOrganizationsChange: (organizations: EventOrganization[] | ((prev: EventOrganization[]) => EventOrganization[])) => void
  onDeleteOrganization: (organization: EventOrganization) => void
}

export function OrganizationManager({
  organizations,
  onOrganizationsChange,
  onDeleteOrganization,
}: OrganizationManagerProps) {
  const {
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
  } = useOrganizationTable(organizations, onOrganizationsChange)

  return (
    <TablePageShell
      icon={Building2}
      title="参加団体管理"
      footer={`${visibleOrganizations.length} 件表示中`}
      actions={(
        <>
          <Button type="button" size="sm" className="ml-2" onClick={adding ? addOrganization : () => setAdding(true)} disabled={adding && !draft.name.trim()}>
            <Plus className="size-4" data-icon-motion="spin" />
            {adding ? "追加を確定" : "団体を追加"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={exportOrganizations}
            disabled={visibleOrganizations.length === 0}
          >
            <Download className="size-4" data-icon-motion="bounce" />
            CSV
          </Button>
        </>
      )}
    >
      <OrganizationsMobileView
        organizations={visibleOrganizations}
        adding={adding}
        draft={draft}
        onDraftChange={setDraft}
        onUpdateOrganization={updateOrganization}
        onDeleteOrganization={onDeleteOrganization}
      />
      <div className="hidden md:block">
        <Table>
          <TablePageHeader>
              <TableHead className="w-14" aria-label="ロゴ" />
              <TableHead className="min-w-60">
                {adding ? (
                  <Input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="参加団体名" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="参加団体名" column="name" value={filters.name} options={headerOptions.name} onChange={(value) => updateFilter("name", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-36">
                {adding ? (
                  <Input value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))} placeholder="種別" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="種別" column="category" value={filters.category} options={headerOptions.category} onChange={(value) => updateFilter("category", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-36">
                {adding ? (
                  <Select value={draft.department} onValueChange={(value) => value && setDraft((prev) => ({ ...prev, department: value as EventDepartment }))}>
                    <SelectTrigger className="h-8 w-full bg-background">
                      <SelectValue>{draft.department}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_DEPARTMENTS.map((department) => (
                        <SelectItem key={`draft-department-${department}`} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <SearchHeader label="部門" column="department" value={filters.department} options={headerOptions.department} onChange={(value) => updateFilter("department", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="hidden min-w-44 md:table-cell">
                {adding ? (
                  <Input value={draft.representative} onChange={(event) => setDraft((prev) => ({ ...prev, representative: event.target.value }))} placeholder="代表者" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="代表者" column="representative" value={filters.representative} options={headerOptions.representative} onChange={(value) => updateFilter("representative", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-32">
                {adding ? (
                  <Input value={draft.booth} onChange={(event) => setDraft((prev) => ({ ...prev, booth: event.target.value }))} placeholder="配置" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="配置" column="booth" value={filters.booth} options={headerOptions.booth} onChange={(value) => updateFilter("booth", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-36">
                {adding ? (
                  <Select value={draft.status} onValueChange={(value) => value && setDraft((prev) => ({ ...prev, status: value as OrganizationStatus }))}>
                    <SelectTrigger className="h-8 w-full bg-background">
                      <SelectValue>{draft.status}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_STATUSES.map((status) => (
                        <SelectItem key={`draft-${status}`} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <SelectHeader label="状態" column="status" value={filters.status} options={ORGANIZATION_STATUSES} onChange={(value) => updateFilter("status", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="hidden min-w-64 lg:table-cell">
                {adding ? (
                  <Input value={draft.note} onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="メモ" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="メモ" column="note" value={filters.note} options={headerOptions.note} onChange={(value) => updateFilter("note", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="w-16" />
          </TablePageHeader>
          <TableBody>
            {visibleOrganizations.map((organization) => (
              <TableRow key={organization.id}>
                <TableCell className="w-14">
                  <OrganizationLogo organization={organization} className="size-10" />
                </TableCell>
                <TableCell className="font-medium">
                  <EditableTextCell value={organization.name} placeholder="参加団体名" onCommit={(value) => updateOrganization(organization.id, { name: value })}>
                    <>
                      {organization.name}
                      <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">
                        {organization.representative || "代表者未設定"}
                      </span>
                    </>
                  </EditableTextCell>
                </TableCell>
                <TableCell>
                  <EditableTextCell value={organization.category} placeholder="種別" onCommit={(value) => updateOrganization(organization.id, { category: value })} />
                </TableCell>
                <TableCell>
                  <EditableSelectCell
                    value={organization.department}
                    options={EVENT_DEPARTMENTS}
                    onCommit={(value) => updateOrganization(organization.id, { department: value })}
                  />
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  <EditableTextCell value={organization.representative} placeholder="代表者" onCommit={(value) => updateOrganization(organization.id, { representative: value })} />
                </TableCell>
                <TableCell>
                  <EditableTextCell value={organization.booth} placeholder="配置" onCommit={(value) => updateOrganization(organization.id, { booth: value })}>
                    {organization.booth || "未定"}
                  </EditableTextCell>
                </TableCell>
                <TableCell>
                  <EditableSelectCell
                    value={organization.status}
                    options={ORGANIZATION_STATUSES}
                    onCommit={(value) => updateOrganization(organization.id, { status: value })}
                  >
                    <Badge variant={organizationStatusVariants[organization.status]}>{organization.status}</Badge>
                  </EditableSelectCell>
                </TableCell>
                <TableCell className="hidden max-w-72 truncate text-muted-foreground lg:table-cell">
                  <EditableTextCell value={organization.note} placeholder="メモ" onCommit={(value) => updateOrganization(organization.id, { note: value })} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteOrganization(organization)}
                      aria-label={`${organization.name}を削除`}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TablePageShell>
  )
}
