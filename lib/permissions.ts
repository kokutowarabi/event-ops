import { memberDepartments, memberRoles, type Member } from "@/lib/members"

export const appViews = [
  "official",
  "shift",
  "roster",
  "organizations",
  "projects",
  "permissions",
  "dtp",
  "kanban",
  "vote",
  "campus",
  "camera",
] as const

export type AppView = (typeof appViews)[number]

export type PermissionSettings = {
  departments: string[]
  roles: string[]
  rolePermissions: Record<string, AppView[]>
  memberPermissions: Record<string, AppView[]>
}

export const defaultMemberViews: AppView[] = ["official", "shift", "vote", "campus", "camera"]
export const defaultAdminViews: AppView[] = [...appViews]

export const defaultPermissionSettings: PermissionSettings = {
  departments: memberDepartments,
  roles: memberRoles,
  rolePermissions: {
    "委員長": defaultAdminViews,
    "副委員長": defaultAdminViews,
    "局長・役員": ["official", "shift", "roster", "organizations", "projects", "dtp", "kanban", "vote", "campus", "camera"],
    "副局長": ["official", "shift", "organizations", "projects", "kanban", "vote", "campus", "camera"],
    "3年会": ["official", "shift", "kanban", "vote", "campus", "camera"],
    "部門長": ["official", "shift", "kanban", "vote", "campus", "camera"],
    "2年継続": defaultMemberViews,
    "1年新規": defaultMemberViews,
  },
  memberPermissions: {},
}

export function normalizePermissionSettings(settings?: Partial<PermissionSettings> | null): PermissionSettings {
  return {
    departments: settings?.departments?.length ? settings.departments : defaultPermissionSettings.departments,
    roles: settings?.roles?.length ? settings.roles : defaultPermissionSettings.roles,
    rolePermissions: { ...defaultPermissionSettings.rolePermissions, ...(settings?.rolePermissions ?? {}) },
    memberPermissions: settings?.memberPermissions ?? {},
  }
}

export function getAllowedViewsForAccount(
  account: { id: string; role: "admin" | "member" } | null,
  members: Member[],
  settings: PermissionSettings,
) {
  if (!account) return defaultMemberViews
  if (account.role === "admin") return defaultAdminViews
  const explicitPermissions = settings.memberPermissions[account.id]
  if (explicitPermissions) return explicitPermissions
  const member = members.find((item) => item.id === account.id || item.email === account.id)
  if (!member) return defaultMemberViews
  return settings.rolePermissions[member.role] ?? defaultMemberViews
}
