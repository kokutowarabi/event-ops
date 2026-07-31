import { Pin } from "lucide-react"
import type { Member } from "@/lib/members"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { memberDepartmentBadgeClass } from "@/lib/member-department"

type ShiftDesktopMemberInfoProps = {
  member: Member
  pinned: boolean
  top: number
  onTogglePin: (memberId: string) => void
}

export function ShiftDesktopMemberInfo({
  member,
  pinned,
  top,
  onTogglePin,
}: ShiftDesktopMemberInfoProps) {
  return (
    <div
      className={`sticky left-0 border-r border-b bg-card p-4 ${pinned ? "z-25 h-[88px] shadow-sm" : "z-10"}`}
      style={pinned ? { top } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 font-medium">{member.name}</div>
        <Button
          type="button"
          size="icon-sm"
          variant={pinned ? "secondary" : "ghost"}
          aria-label={pinned ? `${member.name}のピン留めを解除` : `${member.name}をピン留め`}
          aria-pressed={pinned}
          onClick={() => onTogglePin(member.id)}
        >
          <Pin className={`size-4 ${pinned ? "fill-current" : ""}`} />
        </Button>
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
