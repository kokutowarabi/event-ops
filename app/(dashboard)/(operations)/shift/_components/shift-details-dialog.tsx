import { Eye, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Member } from "@/lib/members"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import {
  formatDate,
  formatTime,
} from "./shift-domain"
import { ShiftTimeFields } from "./shift-time-fields"

type ShiftDetailsDialogProps = {
  open: boolean
  shift: Shift | null
  members: Member[]
  templates: Record<ShiftTemplateId, ShiftTemplate>
  editable: boolean
  onUpdate: (id: string, update: Partial<Shift>) => void
  onDelete: () => void
  onClose: () => void
}

export function ShiftDetailsDialog({
  open,
  shift,
  members,
  templates,
  editable,
  onUpdate,
  onDelete,
  onClose,
}: ShiftDetailsDialogProps) {
  const member = shift
    ? members.find((item) => item.id === shift.memberId) ?? null
    : null
  const template = shift ? templates[shift.templateId] ?? null : null

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {shift && member && template ? (
          <>
            <DialogHeader>
              <DialogTitle>シフト詳細</DialogTitle>
              <DialogDescription>
                {member.name} / {formatDate(shift.date)}
              </DialogDescription>
            </DialogHeader>
            {editable ? (
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label>担当者</Label>
                  <Select
                    value={shift.memberId}
                    onValueChange={(value) =>
                      value !== null && onUpdate(shift.id, { memberId: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{member.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((item) => (
                        <SelectItem key={`detail-member-${item.id}`} value={item.id}>
                          {item.name}・{item.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>担当業務</Label>
                  <Select
                    value={shift.templateId}
                    onValueChange={(value) => {
                      if (value === null) return
                      const templateId = value as ShiftTemplateId
                      const nextTemplate = templates[templateId]
                      onUpdate(shift.id, {
                        templateId,
                        kind: nextTemplate.kind,
                        note: nextTemplate.note,
                      })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{template.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(templates).map((templateId) => (
                        <SelectItem key={`detail-template-${templateId}`} value={templateId}>
                          {templates[templateId].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ShiftTimeFields
                  start={shift.start}
                  end={shift.end}
                  keyPrefix="detail"
                  onChange={(time) => onUpdate(shift.id, time)}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="shift-note">業務・メモ</Label>
                  <Input
                    id="shift-note"
                    value={shift.note}
                    onChange={(event) => onUpdate(shift.id, { note: event.target.value })}
                    placeholder="例: 受付、会場準備など"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 py-2 text-sm">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">担当業務</div>
                  <div className="mt-1 font-medium">{template.label}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">開始</div>
                    <div className="mt-1 font-medium">{formatTime(shift.start)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">終了</div>
                    <div className="mt-1 font-medium">{formatTime(shift.end)}</div>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">業務・メモ</div>
                  <div className="mt-1 font-medium">{shift.note || template.note}</div>
                </div>
              </div>
            )}
            <DialogFooter className="sm:justify-between">
              {editable ? (
                <Button type="button" variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4" data-icon-motion="shake" />
                  削除
                </Button>
              ) : (
                <Badge variant="secondary">
                  <Eye className="size-3" data-icon-motion="bounce" />
                  閲覧のみ
                </Badge>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                閉じる
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
