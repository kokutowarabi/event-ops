import type { ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { formatTime, type ShiftAdjustmentChange } from "./shift-domain"

export function ShiftAdjustmentSummary({
  changes,
  templates,
}: {
  changes: ShiftAdjustmentChange[]
  templates: Record<ShiftTemplateId, ShiftTemplate>
}) {
  if (changes.length === 0) return null

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
      <p className="font-medium text-amber-800">確定すると、他のシフトも変更されます。</p>
      <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-xs">
        {changes.map(({ before, after }) => (
          <li key={before.id} className="flex flex-wrap items-center gap-1 rounded bg-background/70 px-2 py-1.5">
            <span className="font-medium">{templates[before.templateId]?.label ?? before.templateId}</span>
            <span>{formatTime(before.start)}〜{formatTime(before.end)}</span>
            <span aria-hidden="true">→</span>
            {after ? (
              <span className="font-medium">{formatTime(after.start)}〜{formatTime(after.end)}</span>
            ) : (
              <span className="font-semibold text-destructive">削除</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
