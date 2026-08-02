import type { Member } from "@/lib/members"
import type { ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
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
  SLOT_MINUTES,
  timeOptions,
  type ShiftAdjustmentChange,
} from "./shift-domain"
import { ShiftTemplateCreator } from "./shift-template-creator"
import type {
  DraftShift,
  DraftShiftSetter,
  DraftShiftTemplate,
  DraftShiftTemplateSetter,
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
                      setDraft((current) =>
                        current ? { ...current, memberId: value } : current,
                      )
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
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            templateId,
                            end: clampShiftEnd(
                              current.start + template.defaultMinutes,
                              current.start,
                            ),
                            note: template.note,
                          }
                        : current,
                    )
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
                <ShiftTemplateCreator
                  draft={templateDraft}
                  setDraft={setTemplateDraft}
                  onCreate={onCreateTemplate}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>開始</Label>
                  <Select
                    value={formatTime(draft.start)}
                    onValueChange={(value) => {
                      if (value === null) return
                      const start = parseTime(value)
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              start,
                              end: clampShiftEnd(
                                Math.max(current.end, start + SLOT_MINUTES),
                                start,
                              ),
                            }
                          : current,
                      )
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
                      setDraft((current) =>
                        current
                          ? { ...current, end: clampShiftEnd(parseTime(value), current.start) }
                          : current,
                      )
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
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, note: event.target.value } : current,
                    )
                  }
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
