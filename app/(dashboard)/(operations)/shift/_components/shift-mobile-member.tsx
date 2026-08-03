import type { PointerEvent } from "react"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { Badge } from "@/components/ui/badge"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import type { Member } from "@/lib/members"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import { ShiftCreateTimeLabel } from "./shift-create-time-label"
import {
  DEFAULT_SHIFT_TEMPLATE_ID,
  formatTime,
  SLOT_MINUTES,
  START_MINUTES,
  timeOptions,
  type ShiftTemplateColor,
} from "./shift-domain"
import {
  MOBILE_SLOT_HEIGHT,
  MOBILE_TIMELINE_GRID_BACKGROUND,
  MOBILE_TIMELINE_HEIGHT,
  MOBILE_TIMELINE_PADDING_HEIGHT,
  MOBILE_TIMELINE_TRACK_HEIGHT,
  SHIFT_DND_CREATION_ENABLED,
} from "./shift-layout"
import { ShiftMemberActions } from "./shift-member-actions"

export type MobileCreatePreview = {
  top: number
  height: number
  start: number
  end: number
  adjustsConflictingShifts: boolean
}

type ShiftMobileMemberProps = {
  member: Member
  memo: string
  pinned: boolean
  selectedDateShifts: Shift[]
  visibleDateShifts: Shift[]
  hoveredSlot: number | null
  editable: boolean
  templates: Record<ShiftTemplateId, ShiftTemplate>
  createPreview: MobileCreatePreview | null
  getTemplateColor: (templateId: ShiftTemplateId) => ShiftTemplateColor
  onTogglePin: () => void
  onMemoChange: (memo: string) => void
  onBeginCreate: (event: PointerEvent<HTMLButtonElement>) => void
  onMoveCreate: (event: PointerEvent<HTMLButtonElement>) => void
  onFinishCreate: () => void
  onCancelCreate: () => void
  onLeaveTimeline: () => void
  onClearHover: () => void
  onOpenShift: (shiftId: string) => void
}

export function ShiftMobileMember({
  member,
  memo,
  pinned,
  selectedDateShifts,
  visibleDateShifts,
  hoveredSlot,
  editable,
  templates,
  createPreview,
  getTemplateColor,
  onTogglePin,
  onMemoChange,
  onBeginCreate,
  onMoveCreate,
  onFinishCreate,
  onCancelCreate,
  onLeaveTimeline,
  onClearHover,
  onOpenShift,
}: ShiftMobileMemberProps) {
  const memberShifts = (pinned ? selectedDateShifts : visibleDateShifts)
    .filter((shift) => shift.memberId === member.id)
    .sort((left, right) => left.start - right.start)
  const allMemberShifts = selectedDateShifts.filter(
    (shift) => shift.memberId === member.id,
  )

  return (
    <section className="rounded-lg border bg-card p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">{member.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className={`font-normal ${memberDepartmentBadgeClass(member.department)}`}
            >
              {member.department}
            </Badge>
            <MemberRoleBadges value={member.role} />
          </div>
        </div>
        <ShiftMemberActions
          memberName={member.name}
          memo={memo}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onMemoChange={onMemoChange}
        />
      </div>
      <div className="relative" style={{ height: MOBILE_TIMELINE_TRACK_HEIGHT }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-14 right-0 rounded-lg"
          style={{ backgroundImage: MOBILE_TIMELINE_GRID_BACKGROUND }}
        />
        {timeOptions
          .filter((slot) => (slot.minutes - START_MINUTES) % 120 === 0)
          .map((slot) => {
            const slotIndex = (slot.minutes - START_MINUTES) / SLOT_MINUTES
            return (
              <div
                key={`mobile-time-${member.id}-${slot.value}`}
                className="absolute left-0 right-0 border-t border-dashed border-border/70"
                style={{
                  top: MOBILE_TIMELINE_PADDING_HEIGHT + slotIndex * MOBILE_SLOT_HEIGHT,
                }}
              >
                <span className="-mt-2.5 inline-block w-12 bg-card pr-2 text-xs text-muted-foreground">
                  {slot.label}
                </span>
              </div>
            )
          })}
        <button
          type="button"
          disabled={!SHIFT_DND_CREATION_ENABLED || !editable}
          data-shift-member-id={member.id}
          onPointerDown={onBeginCreate}
          onPointerMove={onMoveCreate}
          onPointerUp={onFinishCreate}
          onPointerCancel={onCancelCreate}
          onPointerLeave={onLeaveTimeline}
          className="absolute left-14 right-0 rounded-lg border border-dashed border-border/80 text-left transition enabled:cursor-copy enabled:hover:bg-muted/30 disabled:cursor-default"
          style={{
            top: MOBILE_TIMELINE_PADDING_HEIGHT,
            height: MOBILE_TIMELINE_HEIGHT,
          }}
          aria-label={`${member.name}のシフトを追加`}
        >
          {allMemberShifts.map((shift) => {
            const blockedTop =
              ((shift.start - START_MINUTES) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
            const blockedHeight =
              ((shift.end - shift.start) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
            return (
              <span
                key={`mobile-blocked-slot-${shift.id}`}
                className="absolute inset-x-0 cursor-not-allowed"
                style={{ top: blockedTop, height: blockedHeight }}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerEnter={onClearHover}
                onPointerMove={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                aria-hidden="true"
              />
            )
          })}
          {hoveredSlot !== null ? (
            <span
              className="pointer-events-none absolute inset-x-0 border-b bg-muted"
              style={{
                top: hoveredSlot * MOBILE_SLOT_HEIGHT,
                height: MOBILE_SLOT_HEIGHT,
                borderBottomColor:
                  "color-mix(in oklch, var(--border), transparent 35%)",
              }}
            />
          ) : null}
        </button>
        <div className="absolute inset-y-0 left-14 border-l border-border" />
        {memberShifts.length === 0 ? (
          <div className="pointer-events-none absolute left-16 right-0 top-11 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            この日のシフトはありません
          </div>
        ) : null}
        {createPreview ? (
          <div
            className="pointer-events-none absolute left-16 right-1 z-50 box-border overflow-visible rounded-md border px-2 py-1 text-left shadow-sm"
            style={{
              top: createPreview.top,
              height: Math.max(createPreview.height, 44),
              ...getTemplateColor(DEFAULT_SHIFT_TEMPLATE_ID).blockStyle,
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <ShiftCreateTimeLabel
                start={createPreview.start}
                end={createPreview.end}
                orientation="horizontal"
              />
              <span className="truncate text-xs opacity-80">
                {templates[DEFAULT_SHIFT_TEMPLATE_ID].label}
              </span>
            </div>
            {createPreview.adjustsConflictingShifts ? (
              <span className="absolute left-0 top-full mt-2 w-64 rounded-md border border-amber-500/40 bg-background px-2 py-1.5 text-xs text-amber-700 shadow-sm">
                他のシフトの時間帯が変更される可能性があります。
              </span>
            ) : null}
          </div>
        ) : null}
        {memberShifts.map((shift) => {
          const top =
            MOBILE_TIMELINE_PADDING_HEIGHT
            + ((shift.start - START_MINUTES) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
          const height = Math.max(
            ((shift.end - shift.start) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT,
            44,
          )
          const template = templates[shift.templateId]
          return (
            <button
              key={`mobile-shift-${shift.id}`}
              type="button"
              onClick={() => onOpenShift(shift.id)}
              className="absolute left-16 right-0 flex items-center gap-2 rounded-md border px-3 py-2 text-left shadow-sm"
              style={{ top, height, ...getTemplateColor(shift.templateId).blockStyle }}
            >
              <span className="text-sm font-medium">
                {formatTime(shift.start)}-{formatTime(shift.end)}
              </span>
              <span className="truncate text-xs opacity-80">
                {shift.note || template.label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
