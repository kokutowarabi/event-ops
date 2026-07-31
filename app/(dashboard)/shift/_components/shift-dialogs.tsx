import { Eye, Trash2 } from "lucide-react"
import type { Member } from "@/lib/members"
import type {
  Shift,
  ShiftKind,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
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
import { ShiftAdjustmentSummary } from "./shift-adjustment-summary"
import {
  clampShiftEnd,
  formatDate,
  formatTime,
  parseTime,
  shiftKinds,
  SLOT_MINUTES,
  timeOptions,
  type ShiftAdjustmentChange,
} from "./shift-domain"
import type {
  DraftShift,
  DraftShiftSetter,
  DraftShiftTemplate,
  DraftShiftTemplateSetter,
  PendingShiftAdjustment,
} from "./shift-types"

type ShiftCreationDialogProps = {
  draft: DraftShift | null
  templateDraft: DraftShiftTemplate
  members: Member[]
  templates: Record<ShiftTemplateId, ShiftTemplate>
  adjustmentChanges: ShiftAdjustmentChange[]
  canCreate: boolean
  setDraft: DraftShiftSetter
  setTemplateDraft: DraftShiftTemplateSetter
  onCreateTemplate: () => void
  onCreate: () => void
  onClose: () => void
}

export function ShiftCreationDialog({
  draft,
  templateDraft,
  members,
  templates,
  adjustmentChanges,
  canCreate,
  setDraft,
  setTemplateDraft,
  onCreateTemplate,
  onCreate,
  onClose,
}: ShiftCreationDialogProps) {
  const selectedTemplate = draft ? templates[draft.templateId] : null
  const memberName = draft
    ? members.find((member) => member.id === draft.memberId)?.name ?? ""
    : ""

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {draft && selectedTemplate ? (
          <>
            <DialogHeader>
              <DialogTitle>シフト作成</DialogTitle>
              <DialogDescription>
                {memberName} / {formatDate(draft.date)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>担当者</Label>
                <Select
                  value={draft.memberId}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setDraft((current) => current ? { ...current, memberId: value } : current)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{memberName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={`draft-member-${member.id}`} value={member.id}>
                        {member.name}・{member.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>担当業務</Label>
                <Select
                  value={draft.templateId}
                  onValueChange={(value) => {
                    if (value === null) return
                    const templateId = value as ShiftTemplateId
                    const template = templates[templateId]
                    setDraft((current) => current
                      ? {
                        ...current,
                        templateId,
                        end: clampShiftEnd(current.start + template.defaultMinutes, current.start),
                        note: template.note,
                      }
                      : current)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{selectedTemplate.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(templates).map((templateId) => (
                      <SelectItem key={templateId} value={templateId}>
                        {templates[templateId].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="text-sm font-medium">新しい担当業務を追加</div>
                  <Input
                    value={templateDraft.label}
                    onChange={(event) => setTemplateDraft((current) => ({ ...current, label: event.target.value }))}
                    placeholder="担当業務名"
                  />
                  <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
                    <Select
                      value={templateDraft.kind}
                      onValueChange={(value) => {
                        if (value !== null) {
                          setTemplateDraft((current) => ({ ...current, kind: value as ShiftKind }))
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue>{shiftKinds[templateDraft.kind].label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(shiftKinds) as ShiftKind[]).map((kind) => (
                          <SelectItem key={`template-kind-${kind}`} value={kind}>
                            {shiftKinds[kind].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={templateDraft.defaultMinutes}
                      onChange={(event) =>
                        setTemplateDraft((current) => ({
                          ...current,
                          defaultMinutes: Math.max(
                            15,
                            Math.round(Number(event.target.value || 15) / 15) * 15,
                          ),
                        }))
                      }
                      aria-label="標準時間（分）"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input
                      value={templateDraft.note}
                      onChange={(event) => setTemplateDraft((current) => ({ ...current, note: event.target.value }))}
                      placeholder="標準メモ"
                    />
                    <Button type="button" onClick={onCreateTemplate} disabled={!templateDraft.label.trim()}>
                      追加
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>開始</Label>
                  <Select
                    value={formatTime(draft.start)}
                    onValueChange={(value) => {
                      if (value === null) return
                      const start = parseTime(value)
                      setDraft((current) => current
                        ? {
                          ...current,
                          start,
                          end: clampShiftEnd(Math.max(current.end, start + SLOT_MINUTES), start),
                        }
                        : current)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatTime(draft.start)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.slice(0, -1).map((option) => (
                        <SelectItem key={`draft-start-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>終了</Label>
                  <Select
                    value={formatTime(draft.end)}
                    onValueChange={(value) => {
                      if (value === null) return
                      setDraft((current) => current
                        ? { ...current, end: clampShiftEnd(parseTime(value), current.start) }
                        : current)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatTime(draft.end)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.slice(1).map((option) => (
                        <SelectItem key={`draft-end-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="draft-note">業務・メモ</Label>
                <Input
                  id="draft-note"
                  value={draft.note}
                  onChange={(event) => setDraft((current) => current
                    ? { ...current, note: event.target.value }
                    : current)}
                  placeholder="例: 受付、会場準備など"
                />
              </div>
              {!canCreate ? (
                <p className="text-sm text-destructive">
                  開始時刻と終了時刻を確認してください。
                </p>
              ) : (
                <ShiftAdjustmentSummary changes={adjustmentChanges} templates={templates} />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="button" onClick={onCreate} disabled={!canCreate}>
                作成
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function ShiftAdjustmentDialog({
  pending,
  templates,
  onConfirm,
  onCancel,
}: {
  pending: PendingShiftAdjustment | null
  templates: Record<ShiftTemplateId, ShiftTemplate>
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>シフト変更の確認</DialogTitle>
          <DialogDescription>
            ハンドル操作による変更内容を確認してから確定してください。
          </DialogDescription>
        </DialogHeader>
        {pending ? (
          <ShiftAdjustmentSummary changes={pending.changes} templates={templates} />
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="button" onClick={onConfirm}>
            変更を確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
  const member = shift ? members.find((item) => item.id === shift.memberId) ?? null : null
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
                    onValueChange={(value) => value !== null && onUpdate(shift.id, { memberId: value })}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>開始</Label>
                    <Select
                      value={formatTime(shift.start)}
                      onValueChange={(value) => {
                        if (value === null) return
                        const start = parseTime(value)
                        onUpdate(shift.id, {
                          start,
                          end: clampShiftEnd(Math.max(shift.end, start + SLOT_MINUTES), start),
                        })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{formatTime(shift.start)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.slice(0, -1).map((option) => (
                          <SelectItem key={`detail-start-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>終了</Label>
                    <Select
                      value={formatTime(shift.end)}
                      onValueChange={(value) => value !== null && onUpdate(shift.id, {
                        end: clampShiftEnd(parseTime(value), shift.start),
                      })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{formatTime(shift.end)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.slice(1).map((option) => (
                          <SelectItem key={`detail-end-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                  <Trash2 className="size-4" />
                  削除
                </Button>
              ) : (
                <Badge variant="secondary">
                  <Eye className="size-3" />
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
