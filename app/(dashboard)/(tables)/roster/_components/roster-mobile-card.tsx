import type { Dispatch, SetStateAction } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { EditableMultiSelectCell } from "@/components/common/editable-cell"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import { joinMemberRoles, memberRoleBadgeClass, parseMemberRoles } from "@/lib/member-role"
import type { Member } from "@/lib/members"
import { MemberAvatar } from "@/components/common/member-avatar"

export function RosterMobileMemberCard({
  member,
  onEdit,
  onDelete,
}: {
  member: Member
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article
      aria-label={`${member.name}のメンバーカード`}
      className="w-[min(82vw,20rem)] shrink-0 snap-start rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <MemberAvatar member={member} size={48} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{member.name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{member.email}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="grid gap-1">
          <dt className="text-xs text-muted-foreground">所属</dt>
          <dd>
            <Badge variant="outline" className={`max-w-full truncate font-normal ${memberDepartmentBadgeClass(member.department)}`}>
              {member.department || "未設定"}
            </Badge>
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-xs text-muted-foreground">役職</dt>
          <dd className="flex min-h-6 flex-wrap gap-1.5">
            {member.role ? <MemberRoleBadges value={member.role} /> : <span className="text-muted-foreground">未設定</span>}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" data-icon-motion="shake" />
          編集
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`${member.name}を削除`}
        >
          <Trash2 className="size-4" data-icon-motion="shake" />
        </Button>
      </div>
    </article>
  )
}

export function RosterMobileDraftCard({
  draft,
  departments,
  roles,
  onDraftChange,
}: {
  draft: Omit<Member, "id">
  departments: string[]
  roles: string[]
  onDraftChange: Dispatch<SetStateAction<Omit<Member, "id">>>
}) {
  return (
    <section aria-label="新しいメンバー" className="mx-3 mt-4 grid gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <h2 className="font-semibold">新しいメンバー</h2>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile-draft-name">氏名</Label>
        <Input
          id="mobile-draft-name"
          value={draft.name}
          onChange={(event) => onDraftChange((prev) => ({
            ...prev,
            name: event.target.value,
          }))}
          placeholder="氏名"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile-draft-email">メールアドレス</Label>
        <Input
          id="mobile-draft-email"
          type="email"
          value={draft.email}
          onChange={(event) => onDraftChange((prev) => ({
            ...prev,
            email: event.target.value,
          }))}
          placeholder="メールアドレス"
        />
      </div>
      <div className="grid gap-1.5">
        <Label>所属</Label>
        <Select
          value={draft.department}
          onValueChange={(value) => value !== null && onDraftChange((prev) => ({
            ...prev,
            department: value,
          }))}
        >
          <SelectTrigger className="w-full bg-background"><SelectValue>{draft.department}</SelectValue></SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department} value={department}>{department}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>役職</Label>
        <EditableMultiSelectCell
          values={parseMemberRoles(draft.role)}
          options={roles}
          optionClassName={memberRoleBadgeClass}
          onCommit={(nextRoles) => onDraftChange((prev) => ({
            ...prev,
            role: joinMemberRoles(nextRoles),
          }))}
        >
          <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1">
            {draft.role ? <MemberRoleBadges value={draft.role} /> : <span className="text-sm text-muted-foreground">役職を選択</span>}
          </div>
        </EditableMultiSelectCell>
      </div>
    </section>
  )
}
