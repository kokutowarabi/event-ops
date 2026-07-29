const roleBadgeClasses: Record<string, string> = {
  委員長:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  副委員長:
    "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-200",
  局長:
    "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  役員:
    "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
  副局長:
    "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200",
  "3年会":
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  部門長:
    "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
  "2年継続":
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "1年新規":
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
}

const fallbackBadgeClass =
  "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"

export function parseMemberRoles(value: string) {
  return Array.from(
    new Set(
      value
        .split("・")
        .map((role) => role.trim())
        .filter(Boolean),
    ),
  )
}

export function joinMemberRoles(roles: string[]) {
  return Array.from(new Set(roles.map((role) => role.trim()).filter(Boolean))).join("・")
}

export function memberRoleBadgeClass(role: string) {
  return roleBadgeClasses[role] ?? fallbackBadgeClass
}
