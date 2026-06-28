"use client"

import { useMemo, useState } from "react"
import { Building2, Plus, Trash2 } from "lucide-react"
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
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchHeader, SelectHeader } from "@/components/table-column-header"
import { EditableSelectCell, EditableTextCell } from "@/components/editable-cell"
import { type EventDepartment, type EventOrganization, type OrganizationStatus } from "@/lib/event-data"

const ALL_STATUSES = "すべての状態"
const EVENT_DEPARTMENTS: EventDepartment[] = ["模擬店", "屋外ステージ", "教室"]
const statusVariants: Record<OrganizationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  承認済み: "default",
  確認中: "secondary",
  申請中: "outline",
  要対応: "destructive",
}

const emptyOrganization: Omit<EventOrganization, "id"> = {
  name: "",
  category: "体験",
  department: "教室",
  representative: "",
  contact: "",
  status: "申請中",
  booth: "",
  note: "",
}

type OrganizationSortKey = keyof Omit<EventOrganization, "id">
type SortOrder = "asc" | "desc"

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
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES)
  const [filters, setFilters] = useState<Record<OrganizationSortKey, string>>({
    name: "",
    category: "",
    department: "",
    representative: "",
    contact: "",
    status: "",
    booth: "",
    note: "",
  })
  const [sortKey, setSortKey] = useState<OrganizationSortKey>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [draft, setDraft] = useState(emptyOrganization)
  const [adding, setAdding] = useState(false)

  const headerOptions = useMemo(
    () => ({
      name: organizations.map((organization) => organization.name),
      category: organizations.map((organization) => organization.category),
      department: organizations.map((organization) => organization.department),
      representative: organizations.map((organization) => organization.representative),
      booth: organizations.map((organization) => organization.booth),
      status: organizations.map((organization) => organization.status),
      note: organizations.map((organization) => organization.note),
    }),
    [organizations],
  )

  const visibleOrganizations = useMemo(() => {
    const normalizedFilters = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value.trim().toLowerCase()]),
    ) as Record<OrganizationSortKey, string>
    return organizations
      .filter((organization) => {
      const matchesQuery = (["name", "category", "department", "representative", "contact", "booth", "note"] as OrganizationSortKey[]).every(
        (key) => !normalizedFilters[key] || organization[key].toLowerCase().includes(normalizedFilters[key]),
      )
      const matchesStatus = statusFilter === ALL_STATUSES || organization.status === statusFilter
      return matchesQuery && matchesStatus
    })
      .sort((a, b) => {
        const result = a[sortKey].localeCompare(b[sortKey], "ja")
        return sortOrder === "asc" ? result : -result
      })
  }, [organizations, filters, statusFilter, sortKey, sortOrder])

  const updateFilter = (key: OrganizationSortKey, value: string) => setFilters((prev) => ({ ...prev, [key]: value }))

  const updateOrganization = (id: string, update: Partial<Omit<EventOrganization, "id">>) => {
    onOrganizationsChange((prev) =>
      prev.map((organization) => (organization.id === id ? { ...organization, ...update } : organization)),
    )
  }

  const toggleSort = (key: OrganizationSortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const addOrganization = () => {
    if (!draft.name.trim()) return
    onOrganizationsChange((prev) => [
      ...prev,
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

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 items-center gap-2">
        <Building2 className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">団体管理</h1>
        <Button type="button" size="icon" className="ml-2 size-8" onClick={adding ? addOrganization : () => setAdding(true)} disabled={adding && !draft.name.trim()} aria-label={adding ? "団体を追加" : "追加欄を開く"}>
          <Plus className="size-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-60">
                {adding ? (
                  <Input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="団体名" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="団体名" column="name" value={filters.name} options={headerOptions.name} onChange={(value) => updateFilter("name", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
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
                      {(["申請中", "確認中", "承認済み", "要対応"] as OrganizationStatus[]).map((status) => (
                        <SelectItem key={`draft-${status}`} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <SelectHeader label="状態" column="status" value={statusFilter} allValue={ALL_STATUSES} options={["申請中", "確認中", "承認済み", "要対応"]} onChange={setStatusFilter} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOrganizations.map((organization) => (
              <TableRow key={organization.id}>
                <TableCell className="font-medium">
                  <EditableTextCell value={organization.name} placeholder="団体名" onCommit={(value) => updateOrganization(organization.id, { name: value })}>
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
                    options={["申請中", "確認中", "承認済み", "要対応"]}
                    onCommit={(value) => updateOrganization(organization.id, { status: value })}
                  >
                    <Badge variant={statusVariants[organization.status]}>{organization.status}</Badge>
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
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 shrink-0 text-right text-xs text-muted-foreground">{visibleOrganizations.length} 件表示中</p>
    </div>
  )
}
