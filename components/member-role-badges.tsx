import { Badge } from "@/components/ui/badge"
import { memberRoleBadgeClass, parseMemberRoles } from "@/lib/member-role"

type MemberRoleBadgesProps = {
  value: string
}

export function MemberRoleBadges({ value }: MemberRoleBadgesProps) {
  const roles = parseMemberRoles(value)

  if (roles.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge
          key={role}
          variant="outline"
          className={`font-normal ${memberRoleBadgeClass(role)}`}
        >
          {role}
        </Badge>
      ))}
    </span>
  )
}
