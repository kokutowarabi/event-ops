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
import { ShiftAdjustmentSummary } from "./shift-adjustment-summary"
import type { PendingShiftAdjustment } from "./shift-types"

type ShiftAdjustmentDialogProps = {
  pending: PendingShiftAdjustment | null
  templates: Record<ShiftTemplateId, ShiftTemplate>
  onConfirm: () => void
  onCancel: () => void
}

export function ShiftAdjustmentDialog({
  pending,
  templates,
  onConfirm,
  onCancel,
}: ShiftAdjustmentDialogProps) {
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
