const bureauBadgeClasses: Record<string, string> = {
  執行部:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  運営局:
    "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  演出局:
    "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-200",
  参加団体局:
    "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
  開発局:
    "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200",
  制作局:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  財務局:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  総務局:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  渉外局:
    "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
  広報局:
    "border-pink-300 bg-pink-50 text-pink-800 dark:border-pink-800 dark:bg-pink-950/50 dark:text-pink-200",
}

const fallbackBadgeClass =
  "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"

export function getMemberBureau(department: string) {
  return department.split("・")[0]?.trim() || ""
}

export function memberDepartmentBadgeClass(department: string) {
  return bureauBadgeClasses[getMemberBureau(department)] ?? fallbackBadgeClass
}
