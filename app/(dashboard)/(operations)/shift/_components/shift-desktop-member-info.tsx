import type { Member } from "@/lib/members"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { Badge } from "@/components/ui/badge"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import { ShiftMemberActions } from "./shift-member-actions"

type ShiftDesktopMemberInfoProps = {
  member: Member
  memo: string
  pinned: boolean
  top: number
  onTogglePin: (memberId: string) => void
  onMemoChange: (memo: string) => void
}

export function ShiftDesktopMemberInfo({
  member,
  memo,
  pinned,
  top,
  onTogglePin,
  onMemoChange,
}: ShiftDesktopMemberInfoProps) {
  return (
    <div
      className={`sticky left-0 border-r border-b bg-card p-4 ${pinned ? "z-25 h-[88px] shadow-sm" : "z-10"}`}
      style={pinned ? { top } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 font-medium">{member.name}</div>
        <ShiftMemberActions
          memberName={member.name}
          memo={memo}
          pinned={pinned}
          onTogglePin={() => onTogglePin(member.id)}
          onMemoChange={onMemoChange}
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Badge
          variant="outline"
          className={`font-normal ${memberDepartmentBadgeClass(member.department)}`}
        >
          {member.department}
        </Badge>
        <MemberRoleBadges value={member.role} />
      </div>
    </div>
  )
}
