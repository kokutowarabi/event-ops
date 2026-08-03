import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ShiftKind } from "@/lib/shift-data"
import { shiftKinds } from "./shift-domain"
import type {
  DraftShiftTemplate,
  DraftShiftTemplateSetter,
} from "./shift-types"

type ShiftTemplateCreatorProps = {
  draft: DraftShiftTemplate
  setDraft: DraftShiftTemplateSetter
  onCreate: () => void
}

export function ShiftTemplateCreator({
  draft,
  setDraft,
  onCreate,
}: ShiftTemplateCreatorProps) {
  return (
    <div className="grid gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
      <div className="text-sm font-medium">新しい担当業務を追加</div>
      <Input
        value={draft.label}
        onChange={(event) =>
          setDraft((current) => ({ ...current, label: event.target.value }))
        }
        placeholder="担当業務名"
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
        <Select
          value={draft.kind}
          onValueChange={(value) => {
            if (value !== null) {
              setDraft((current) => ({ ...current, kind: value as ShiftKind }))
            }
          }}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue>{shiftKinds[draft.kind].label}</SelectValue>
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
          value={draft.defaultMinutes}
          onChange={(event) =>
            setDraft((current) => ({
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
          value={draft.note}
          onChange={(event) =>
            setDraft((current) => ({ ...current, note: event.target.value }))
          }
          placeholder="標準メモ"
        />
        <Button type="button" onClick={onCreate} disabled={!draft.label.trim()}>
          追加
        </Button>
      </div>
    </div>
  )
}
