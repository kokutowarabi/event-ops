import type { MouseEvent } from "react"
import { MemberRoleBadges } from "@/components/common/member-role-badges"
import { Badge } from "@/components/ui/badge"
import { memberDepartmentBadgeClass } from "@/lib/member-department"
import type { Member } from "@/lib/members"
import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import {
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
} from "./shift-layout"
import { ShiftMemberActions } from "./shift-member-actions"

type ShiftMobileMemberProps = {
  member: Member
  memo: string
  pinned: boolean
  selectedDateShifts: Shift[]
  visibleDateShifts: Shift[]
  editable: boolean
  templates: Record<ShiftTemplateId, ShiftTemplate>
  getTemplateColor: (templateId: ShiftTemplateId) => ShiftTemplateColor
  onTogglePin: () => void
  onMemoChange: (memo: string) => void
  onCreateAt: (start: number) => void
  onOpenShift: (shiftId: string) => void
}

export function ShiftMobileMember({
  member,
  memo,
  pinned,
  selectedDateShifts,
  visibleDateShifts,
  editable,
  templates,
  getTemplateColor,
  onTogglePin,
  onMemoChange,
  onCreateAt,
  onOpenShift,
}: ShiftMobileMemberProps) {
  const memberShifts = (pinned ? selectedDateShifts : visibleDateShifts)
    .filter((shift) => shift.memberId === member.id)
    .sort((left, right) => left.start - right.start)
  const allMemberShifts = selectedDateShifts.filter(
    (shift) => shift.memberId === member.id,
  )
  const openCreateDialog = (event: MouseEvent<HTMLButtonElement>) => {
    const timelineTop = event.currentTarget.getBoundingClientRect().top
    const slot = Math.min(
      Math.max(Math.floor((event.clientY - timelineTop) / MOBILE_SLOT_HEIGHT), 0),
      timeOptions.length - 1,
    )
    onCreateAt(START_MINUTES + slot * SLOT_MINUTES)
  }

  return (
    <article
      aria-label={`${member.name}のシフトカード`}
      className="w-[min(86vw,22rem)] shrink-0 snap-start rounded-xl border bg-card p-3 shadow-sm"
    >
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
      <div className="h-[min(58svh,34rem)] overflow-y-auto overscroll-y-contain rounded-lg pr-1">
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
          disabled={!editable}
          data-shift-member-id={member.id}
          onClick={openCreateDialog}
          className="absolute left-14 right-0 rounded-lg border border-dashed border-border/80 text-left transition enabled:cursor-pointer disabled:cursor-default"
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
                onClick={(event) => event.stopPropagation()}
                aria-hidden="true"
              />
            )
          })}
        </button>
        <div className="absolute inset-y-0 left-14 border-l border-border" />
        {memberShifts.length === 0 ? (
          <div className="pointer-events-none absolute left-16 right-0 top-11 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            この日のシフトはありません
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
      </div>
    </article>
  )
}
