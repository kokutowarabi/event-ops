import type { Dispatch, SetStateAction } from "react"
import { Check, Trash2 } from "lucide-react"
import { EditableMultiSelectCell, EditableSelectCell, EditableTextCell } from "@/components/common/editable-cell"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { SearchHeader, SelectHeader } from "@/components/common/table-column-header"
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
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import { joinMemberRoles, memberRoleBadgeClass, parseMemberRoles } from "@/lib/member-role"
import type { Member, SortKey, SortOrder } from "@/lib/members"
import { TablePageHeader } from "../../_components/table-page-header"
import type { RosterFilters, RosterHeaderOptions } from "./roster-types"

type RosterDesktopTableProps = {
  members: Member[]
  adding: boolean
  draft: Omit<Member, "id">
  filters: RosterFilters
  headerOptions: RosterHeaderOptions
  departments: string[]
  roleOptions: string[]
  sortKey: SortKey
  sortOrder: SortOrder
  onDraftChange: Dispatch<SetStateAction<Omit<Member, "id">>>
  onFilterChange: (key: SortKey, value: string[]) => void
  onSort: (key: SortKey) => void
  onUpdateMember: (id: string, update: Partial<Omit<Member, "id">>) => void
  onDeleteMember: (id: string) => void
}

export function RosterDesktopTable({
  members,
  adding,
  draft,
  filters,
  headerOptions,
  departments,
  roleOptions,
  sortKey,
  sortOrder,
  onDraftChange,
  onFilterChange,
  onSort,
  onUpdateMember,
  onDeleteMember,
}: RosterDesktopTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TablePageHeader>
          <TableHead className="min-w-56">
            {adding ? (
              <Input
                value={draft.name}
                onChange={(event) => onDraftChange((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))}
                placeholder="氏名"
                className="h-8 bg-background"
              />
            ) : (
              <SearchHeader
                label="氏名"
                column="name"
                value={filters.name}
                options={headerOptions.name}
                onChange={(value) => onFilterChange("name", value)}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            )}
          </TableHead>
          <TableHead className="min-w-64">
            {adding ? (
              <Input
                value={draft.email}
                onChange={(event) => onDraftChange((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))}
                placeholder="メール"
                className="h-8 bg-background"
              />
            ) : (
              <SearchHeader
                label="メールアドレス"
                column="email"
                value={filters.email}
                options={headerOptions.email}
                onChange={(value) => onFilterChange("email", value)}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            )}
          </TableHead>
          <TableHead className="min-w-44">
            {adding ? (
              <Select
                value={draft.department}
                onValueChange={(value) => value !== null && onDraftChange((prev) => ({
                  ...prev,
                  department: value,
                }))}
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
              <SelectHeader
                label="所属"
                column="department"
                value={filters.department}
                options={departments}
                onChange={(value) => onFilterChange("department", value)}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            )}
          </TableHead>
          <TableHead className="min-w-44">
            {adding ? (
              <EditableMultiSelectCell
                values={parseMemberRoles(draft.role)}
                options={roleOptions}
                optionClassName={memberRoleBadgeClass}
                onCommit={(nextRoles) => onDraftChange((prev) => ({
                  ...prev,
                  role: joinMemberRoles(nextRoles),
                }))}
              >
                <MemberRoleBadges value={draft.role} />
              </EditableMultiSelectCell>
            ) : (
              <SearchHeader
                label="役職"
                column="role"
                value={filters.role}
                options={headerOptions.role}
                onChange={(value) => onFilterChange("role", value)}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            )}
          </TableHead>
          <TableHead className="w-22" />
        </TablePageHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                該当するメンバーがいません。
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <EditableTextCell
                    value={member.name}
                    placeholder="氏名"
                    onCommit={(value) => onUpdateMember(member.id, { name: value })}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <EditableTextCell
                    value={member.email}
                    placeholder="メール"
                    onCommit={(value) => onUpdateMember(member.id, { email: value })}
                  />
                </TableCell>
                <TableCell>
                  <EditableSelectCell
                    value={member.department}
                    options={departments}
                    onCommit={(value) => onUpdateMember(member.id, { department: value })}
                  >
                    {member.department ? (
                      <Badge variant="outline" className={`font-normal ${memberDepartmentBadgeClass(member.department)}`}>
                        {member.department}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </EditableSelectCell>
                </TableCell>
                <TableCell>
                  <EditableMultiSelectCell
                    values={parseMemberRoles(member.role)}
                    options={roleOptions}
                    optionClassName={memberRoleBadgeClass}
                    onCommit={(nextRoles) => onUpdateMember(member.id, {
                      role: joinMemberRoles(nextRoles),
                    })}
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
                      onClick={() => onDeleteMember(member.id)}
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
  )
}
