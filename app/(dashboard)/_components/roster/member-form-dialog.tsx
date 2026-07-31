import { useState, type ChangeEvent, type FormEvent } from "react"
import type { Member } from "@/lib/members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type MemberFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (member: Omit<Member, "id">) => void
  initialValue?: Member | null
}

const emptyForm = { name: "", email: "", department: "", role: "" }

export function MemberFormDialog({ open, onOpenChange, onSubmit, initialValue }: MemberFormDialogProps) {
  const [form, setForm] = useState(
    initialValue
      ? {
          name: initialValue.name,
          email: initialValue.email,
          department: initialValue.department,
          role: initialValue.role,
        }
      : emptyForm,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "氏名を入力してください"
    if (!form.email.trim()) {
      nextErrors.email = "メールアドレスを入力してください"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "正しいメールアドレスを入力してください"
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      role: form.role.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialValue ? "メンバーを編集" : "メンバーを追加"}</DialogTitle>
            <DialogDescription>名簿に登録する情報を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                氏名 <span className="text-destructive">*</span>
              </Label>
              <Input id="name" value={form.name} onChange={update("name")} placeholder="山田 太郎" />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">
                メールアドレス <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="taro@hoshihama.example"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">運営セクション</Label>
              <Input id="department" value={form.department} onChange={update("department")} placeholder="受付" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">担当役割</Label>
              <Input id="role" value={form.role} onChange={update("role")} placeholder="受付リーダー" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">{initialValue ? "更新" : "追加"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
