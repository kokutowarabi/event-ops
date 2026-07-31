import { useMemo, useState } from "react"
import {
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditableMultiSelectCell, EditableSelectCell, EditableTextCell } from "@/components/common/editable-cell"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { SearchHeader, SelectHeader } from "@/components/common/table-column-header"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import { joinMemberRoles, memberRoleBadgeClass, parseMemberRoles } from "@/lib/member-role"
import { matchesSelectedValues } from "@/lib/table-filters"
import { cn } from "@/lib/utils"

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

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase()

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-6xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">名簿</h1>
          <Button type="button" size="icon" className="ml-2 size-8" onClick={adding ? addMember : () => setAdding(true)} disabled={adding && (!draft.name.trim() || !draft.email.trim())} aria-label={adding ? "メンバーを追加" : "追加欄を開く"}>
            <Plus className="size-4" />
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
      </header>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="bg-muted/40 hover:bg-muted/40">
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
                  <select value={draft.department} onChange={(event) => setDraft((prev) => ({ ...prev, department: event.target.value }))} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm">
                    {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                  </select>
                ) : (
                  <SelectHeader label="所属局" column="department" value={filters.department} options={departments} onChange={(value) => updateFilter("department", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
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
            </TableRow>
          </TableHeader>
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
      </div>

      <p className="mt-2 shrink-0 text-right text-xs text-muted-foreground">
        {visibleMembers.length} 件表示中
      </p>

      <Dialog open={detailDraft !== null} onOpenChange={(open) => !open && setDetailDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailDraft ? (
            <>
              <DialogHeader>
                <DialogTitle>メンバー詳細</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-2">
                <div className="flex items-center gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-200 via-emerald-100 to-amber-100 text-2xl font-bold text-slate-700 ring-1 ring-border">
                    {initials(detailDraft.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold">{detailDraft.name || "名前未設定"}</div>
                    <div className="mt-1 truncate text-sm text-muted-foreground">{detailDraft.email}</div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="detail-name">氏名</Label>
                    <Input
                      id="detail-name"
                      value={detailDraft.name}
                      onChange={(event) => setDetailDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="detail-email">メール</Label>
                    <Input
                      id="detail-email"
                      type="email"
                      value={detailDraft.email}
                      onChange={(event) => setDetailDraft((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="detail-department">所属</Label>
                    <select
                      id="detail-department"
                      value={detailDraft.department}
                      onChange={(event) => setDetailDraft((prev) => (prev ? { ...prev, department: event.target.value } : prev))}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      {departments.map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>役職（複数選択可）</Label>
                    <div className="flex min-h-8 flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2">
                      {roleOptions.map((role) => {
                        const selected = parseMemberRoles(detailDraft.role).includes(role)
                        return (
                          <button
                            key={role}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              setDetailDraft((prev) => {
                                if (!prev) return prev
                                const currentRoles = parseMemberRoles(prev.role)
                                const nextRoles = selected
                                  ? currentRoles.filter((currentRole) => currentRole !== role)
                                  : [...currentRoles, role]
                                return { ...prev, role: joinMemberRoles(nextRoles) }
                              })
                            }
                            className={cn(
                              "h-7 cursor-pointer rounded-lg border px-2 text-xs transition-colors",
                              selected
                                ? memberRoleBadgeClass(role)
                                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {role}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDetailDraft(null)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={saveDetailDraft}>
                  保存
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
