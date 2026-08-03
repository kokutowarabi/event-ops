import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { memberRoleBadgeClass, parseMemberRoles, joinMemberRoles } from "@/lib/member-role"
import type { Member } from "@/lib/members"
import { cn } from "@/lib/utils"

type MemberDetailDialogProps = {
  draft: Member | null
  departments: string[]
  roles: string[]
  setDraft: Dispatch<SetStateAction<Member | null>>
  onSave: () => void
  onClose: () => void
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function MemberDetailDialog({
  draft,
  departments,
  roles,
  setDraft,
  onSave,
  onClose,
}: MemberDetailDialogProps) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {draft ? (
          <>
            <DialogHeader>
              <DialogTitle>メンバー詳細</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-2">
              <div className="flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-200 via-emerald-100 to-amber-100 text-2xl font-bold text-slate-700 ring-1 ring-border">
                  {getInitials(draft.name)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold">
                    {draft.name || "名前未設定"}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {draft.email}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="detail-name">氏名</Label>
                  <Input
                    id="detail-name"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, name: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="detail-email">メール</Label>
                  <Input
                    id="detail-email"
                    type="email"
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, email: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="detail-department">所属</Label>
                  <select
                    id="detail-department"
                    value={draft.department}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, department: event.target.value }
                          : current,
                      )
                    }
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label>役職（複数選択可）</Label>
                  <div className="flex min-h-8 flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2">
                    {roles.map((role) => {
                      const selected = parseMemberRoles(draft.role).includes(role)
                      return (
                        <button
                          key={role}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setDraft((current) => {
                              if (!current) return current
                              const currentRoles = parseMemberRoles(current.role)
                              const nextRoles = selected
                                ? currentRoles.filter((item) => item !== role)
                                : [...currentRoles, role]
                              return { ...current, role: joinMemberRoles(nextRoles) }
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
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="button" onClick={onSave}>
                保存
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
