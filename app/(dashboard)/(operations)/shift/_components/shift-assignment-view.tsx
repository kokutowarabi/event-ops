import { Plus } from "lucide-react"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  COVERAGE_SLOT_MINUTES,
  coverageTimeSlots,
  formatTime,
  type ShiftTemplateColor,
} from "./shift-domain"

export type AssignmentCoverageGroup = {
  templateId: ShiftTemplateId
  template: ShiftTemplate
  assignments: Shift[]
  slotCounts: number[]
  maxOverlap: number
  totalMinutes: number
  memberCount: number
}

export function ShiftAssignmentView({
  groups,
  creationEnabled,
  getTemplateColor,
  getMemberName,
  onOpenDraft,
  onOpenShift,
}: {
  groups: AssignmentCoverageGroup[]
  creationEnabled: boolean
  getTemplateColor: (templateId: ShiftTemplateId) => ShiftTemplateColor
  getMemberName: (memberId: string) => string
  onOpenDraft: (templateId: ShiftTemplateId, start?: number) => void
  onOpenShift: (shiftId: string) => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card p-3 md:p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">担当業務別の配置</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            色の数字は同じ時間帯に入っている人数です。時間帯または割り当てをクリックして編集できます。
          </p>
        </div>
        <Badge variant="outline">{groups.length}業務</Badge>
      </div>
      <div className="grid gap-4">
        {groups.map((group) => (
          <section key={`coverage-${group.templateId}`} className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div
                className="mt-1 size-3 shrink-0 rounded-full"
                style={getTemplateColor(group.templateId).dotStyle}
              />
              <div>
                <h3 className="font-semibold">{group.template.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {group.memberCount}名・延べ
                  {(group.totalMinutes / 60).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}時間・
                  最大{group.maxOverlap}名重複
                </p>
              </div>
              {creationEnabled ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => onOpenDraft(group.templateId)}
                >
                  <Plus className="size-3.5" data-icon-motion="spin" />
                  割り当て追加
                </Button>
              ) : null}
            </div>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-180">
                <div
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${coverageTimeSlots.length}, minmax(20px, 1fr))` }}
                >
                  {group.slotCounts.map((count, index) => {
                    const start = coverageTimeSlots[index]
                    const overlapClass = count === 0
                      ? "bg-muted/25 text-muted-foreground/45"
                      : count === 1
                        ? "bg-sky-500/15 text-sky-800"
                        : count <= 3
                          ? "bg-amber-500/25 text-amber-900"
                          : "bg-rose-500/30 text-rose-900"
                    return (
                      <button
                        key={`${group.templateId}-${start}`}
                        type="button"
                        disabled={!creationEnabled}
                        className={`h-9 rounded-sm text-[11px] font-semibold transition enabled:hover:ring-2 enabled:hover:ring-ring/40 ${overlapClass}`}
                        title={`${formatTime(start)}〜${formatTime(start + COVERAGE_SLOT_MINUTES)}: ${count}名`}
                        onClick={() => onOpenDraft(group.templateId, start)}
                      >
                        {count}
                      </button>
                    )
                  })}
                </div>
                <div
                  className="mt-1 grid gap-0.5 text-[10px] text-muted-foreground"
                  style={{ gridTemplateColumns: `repeat(${coverageTimeSlots.length}, minmax(20px, 1fr))` }}
                >
                  {coverageTimeSlots.map((start, index) => (
                    <span key={`coverage-time-${start}`} className="truncate">
                      {index % 4 === 0 ? formatTime(start) : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex max-h-40 flex-wrap gap-2 overflow-auto">
              {group.assignments.map((shift) => (
                <button
                  key={`coverage-assignment-${shift.id}`}
                  type="button"
                  className="rounded-lg border px-2.5 py-2 text-left text-xs transition hover:ring-2 hover:ring-ring/30"
                  style={getTemplateColor(shift.templateId).blockStyle}
                  onClick={() => onOpenShift(shift.id)}
                >
                  <span className="font-semibold">{getMemberName(shift.memberId)}</span>
                  <span className="ml-2 opacity-75">
                    {formatTime(shift.start)}〜{formatTime(shift.end)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
