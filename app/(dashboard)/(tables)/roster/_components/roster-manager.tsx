import { useMemo, useState } from "react"
import {
  Check,
  Download,
  Info,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import { exportToCsv, memberDepartments, memberRoles, type Member, type SortKey, type SortOrder } from "@/lib/members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { EditableMultiSelectCell, EditableSelectCell, EditableTextCell } from "@/components/common/editable-cell"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { SearchHeader, SelectHeader } from "@/components/common/table-column-header"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import { joinMemberRoles, memberRoleBadgeClass, parseMemberRoles } from "@/lib/member-role"
import { matchesSelectedValues } from "@/lib/table-filters"
import { TablePageHeader } from "../../_components/table-page-header"
import { TablePageShell } from "../../_components/table-page-shell"
import { MemberDetailDialog } from "./member-detail-dialog"

type RosterManagerProps = {
  members: Member[]
  departments?: string[]
  roles?: string[]
  onMembersChange: (members: Member[] | ((prev: Member[]) => Member[])) => void
  onDeleteMember: (id: string) => void
}

export function RosterManager({ members, departments = memberDepartments, roles = memberRoles, onMembersChange, onDeleteMember }: RosterManagerProps) {
  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...roles.flatMap(parseMemberRoles),
          ...members.flatMap((member) => parseMemberRoles(member.role)),
        ]),
      ).filter(Boolean),
    [members, roles],
  )
  const [filters, setFilters] = useState<Record<SortKey, string[]>>({
    name: [],
    email: [],
    department: [],
    role: [],
  })
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [draft, setDraft] = useState<Omit<Member, "id">>({ name: "", email: "", department: departments[0] ?? "", role: roles[0] ?? "" })
  const [adding, setAdding] = useState(false)
  const [detailDraft, setDetailDraft] = useState<Member | null>(null)

  const headerOptions = useMemo(
    () => ({
      name: members.map((member) => member.name),
      email: members.map((member) => member.email),
      department: members.map((member) => member.department),
      role: members.flatMap((member) => parseMemberRoles(member.role)),
    }),
    [members],
  )

  const visibleMembers = useMemo(() => {
    const filtered = members.filter((m) => {
      return (Object.keys(filters) as SortKey[]).every((key) => {
        const values = key === "role" ? parseMemberRoles(m.role) : [m[key]]
        return matchesSelectedValues(values, filters[key])
      })
    })
    return filtered.sort((a, b) => {
      const result = a[sortKey].localeCompare(b[sortKey], "ja")
      return sortOrder === "asc" ? result : -result
    })
  }, [members, filters, sortKey, sortOrder])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev: SortOrder) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const handleDelete = (id: string) => {
    onDeleteMember(id)
  }

  const updateFilter = (key: SortKey, value: string[]) => setFilters((prev) => ({ ...prev, [key]: value }))

  const updateMember = (id: string, update: Partial<Omit<Member, "id">>) => {
    onMembersChange((prev) => prev.map((member) => (member.id === id ? { ...member, ...update } : member)))
  }

  const addMember = () => {
    if (!draft.name.trim() || !draft.email.trim()) return
    onMembersChange((prev) => [
      ...prev,
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

  return (
    <>
      <TablePageShell
        icon={Users}
        title="名簿"
        footer={`${visibleMembers.length} 件表示中`}
        actions={(
          <>
            <Button type="button" size="sm" className="ml-2" onClick={adding ? addMember : () => setAdding(true)} disabled={adding && (!draft.name.trim() || !draft.email.trim())}>
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
        <Table>
          <TablePageHeader>
              <TableHead className="min-w-56">
                {adding ? (
                  <Input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="氏名" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="氏名" column="name" value={filters.name} options={headerOptions.name} onChange={(value) => updateFilter("name", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="hidden min-w-64 md:table-cell">
                {adding ? (
                  <Input value={draft.email} onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))} placeholder="メール" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="メールアドレス" column="email" value={filters.email} options={headerOptions.email} onChange={(value) => updateFilter("email", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-44">
                {adding ? (
                  <Select
                    value={draft.department}
                    onValueChange={(value) => {
                      if (value !== null) setDraft((prev) => ({ ...prev, department: value }))
                    }}
                  >
                    <SelectTrigger className="h-8 w-full bg-background">
                      <SelectValue>{draft.department}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-max">
                      {departments.map((department) => (
                        <SelectItem key={department} value={department} hideIndicator className="pr-2 pl-2">
                          <span className="grid size-4 shrink-0 place-items-center">
                            {department === draft.department ? <Check className="size-4" /> : null}
                          </span>
                          <span className={department === draft.department ? "font-semibold" : ""}>
                            {department}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <SelectHeader label="所属" column="department" value={filters.department} options={departments} onChange={(value) => updateFilter("department", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="hidden min-w-44 sm:table-cell">
                {adding ? (
                  <EditableMultiSelectCell
                    values={parseMemberRoles(draft.role)}
                    options={roleOptions}
                    optionClassName={memberRoleBadgeClass}
                    onCommit={(nextRoles) => setDraft((prev) => ({ ...prev, role: joinMemberRoles(nextRoles) }))}
                  >
                    <MemberRoleBadges value={draft.role} />
                  </EditableMultiSelectCell>
                ) : (
                  <SearchHeader label="役職" column="role" value={filters.role} options={headerOptions.role} onChange={(value) => updateFilter("role", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="w-22">
              </TableHead>
          </TablePageHeader>
          <TableBody>
            {visibleMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  該当するメンバーがいません。
                </TableCell>
              </TableRow>
            ) : (
              visibleMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <EditableTextCell value={member.name} placeholder="氏名" onCommit={(value) => updateMember(member.id, { name: value })}>
                        <>
                          {member.name}
                          <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">{member.email}</span>
                        </>
                      </EditableTextCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDetailDraft(member)}
                        aria-label={`${member.name}の詳細`}
                      >
                        <Info className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    <EditableTextCell value={member.email} placeholder="メール" onCommit={(value) => updateMember(member.id, { email: value })} />
                  </TableCell>
                  <TableCell>
                    <EditableSelectCell value={member.department} options={departments} onCommit={(value) => updateMember(member.id, { department: value })}>
                      {member.department ? (
                        <Badge
                          variant="outline"
                          className={`font-normal ${memberDepartmentBadgeClass(member.department)}`}
                        >
                          {member.department}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </EditableSelectCell>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <EditableMultiSelectCell
                      values={parseMemberRoles(member.role)}
                      options={roleOptions}
                      optionClassName={memberRoleBadgeClass}
                      onCommit={(nextRoles) => updateMember(member.id, { role: joinMemberRoles(nextRoles) })}
                    >
                      <MemberRoleBadges value={member.role} />
                    </EditableMultiSelectCell>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(member.id)}
                        aria-label={`${member.name}を削除`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
