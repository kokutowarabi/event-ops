import { useState, type Dispatch, type SetStateAction } from "react"
import type { Member } from "@/lib/members"
import type {
  Shift,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
import {
  adjustConflictingShiftRanges,
  clampShiftEnd,
  DEFAULT_SHIFT_TEMPLATE_ID,
  END_MINUTES,
  getShiftAdjustmentChanges,
} from "./shift-domain"
import type {
  DraftShift,
  DraftShiftTemplate,
} from "./shift-types"

type ShiftDraftOptions = {
  selectedDate: string
  scheduledMembers: Member[]
  selectedDateShifts: Shift[]
  shifts: Shift[]
  templates: Record<ShiftTemplateId, ShiftTemplate>
  setCustomTemplates: Dispatch<
    SetStateAction<Record<ShiftTemplateId, ShiftTemplate>>
  >
  setShiftsWithoutHistory: (shifts: Shift[]) => void
  recordHistorySnapshot: (shifts: Shift[]) => void
}

const emptyTemplateDraft: DraftShiftTemplate = {
  label: "",
  kind: "day",
  defaultMinutes: 60,
  note: "",
}

export function useShiftDrafts({
  selectedDate,
  scheduledMembers,
  selectedDateShifts,
  shifts,
  templates,
  setCustomTemplates,
  setShiftsWithoutHistory,
  recordHistorySnapshot,
}: ShiftDraftOptions) {
  const [draftShift, setDraftShift] = useState<DraftShift | null>(null)
  const [draftBaseShifts, setDraftBaseShifts] = useState<Shift[] | null>(null)
  const [templateDraft, setTemplateDraft] =
    useState<DraftShiftTemplate>(emptyTemplateDraft)

  const currentDraftBaseShifts = draftBaseShifts ?? shifts
  const conflictResolution = draftShift
    ? adjustConflictingShiftRanges(
        currentDraftBaseShifts,
        draftShift.memberId,
        draftShift.date,
        draftShift.start,
        draftShift.end,
      )
    : null
  const adjustmentChanges = conflictResolution
    ? getShiftAdjustmentChanges(currentDraftBaseShifts, conflictResolution.shifts)
    : []

  const openAssignmentDraft = (templateId: ShiftTemplateId, start = 10 * 60) => {
    const template = templates[templateId]
    const end = clampShiftEnd(
      Math.min(start + template.defaultMinutes, END_MINUTES),
      start,
    )
    const availableMember =
      scheduledMembers.find((member) =>
        !selectedDateShifts.some(
          (shift) =>
            shift.memberId === member.id
            && shift.start < end
            && shift.end > start,
        ),
      ) ?? scheduledMembers[0]
    if (!availableMember) return
    setDraftBaseShifts(null)
    setDraftShift({
      memberId: availableMember.id,
      date: selectedDate,
      start,
      end,
      templateId,
      note: template.note,
    })
  }

  const openMemberDraft = (memberId: string, start: number) => {
    const occupied = selectedDateShifts.some(
      (shift) =>
        shift.memberId === memberId
        && shift.start <= start
        && shift.end > start,
    )
    if (occupied) return

    const template = templates[DEFAULT_SHIFT_TEMPLATE_ID]
    const nextShiftStart = selectedDateShifts.reduce<number | null>(
      (nextStart, shift) => {
        if (shift.memberId !== memberId || shift.start <= start) return nextStart
        return nextStart === null ? shift.start : Math.min(nextStart, shift.start)
      },
      null,
    )
    const end = clampShiftEnd(
      Math.min(
        start + template.defaultMinutes,
        nextShiftStart ?? END_MINUTES,
      ),
      start,
    )

    setDraftBaseShifts(null)
    setDraftShift({
      memberId,
      date: selectedDate,
      start,
      end,
      templateId: DEFAULT_SHIFT_TEMPLATE_ID,
      note: template.note,
    })
  }

  const createDraftShift = () => {
    if (!draftShift || !conflictResolution) return
    const template = templates[draftShift.templateId]
    const shift: Shift = {
      id: crypto.randomUUID(),
      memberId: draftShift.memberId,
      date: draftShift.date,
      start: draftShift.start,
      end: draftShift.end,
      templateId: draftShift.templateId,
      kind: template.kind,
      note: draftShift.note.trim() || template.note,
    }
    recordHistorySnapshot(currentDraftBaseShifts)
    setShiftsWithoutHistory([...conflictResolution.shifts, shift])
    setDraftShift(null)
    setDraftBaseShifts(null)
  }

  const closeDraftShift = () => {
    setDraftShift(null)
    setDraftBaseShifts(null)
  }

  const createShiftTemplate = () => {
    const label = templateDraft.label.trim()
    if (!label) return
    const id = `custom-${crypto.randomUUID()}`
    const template: ShiftTemplate = {
      label,
      kind: templateDraft.kind,
      defaultMinutes: templateDraft.defaultMinutes,
      note: templateDraft.note.trim() || label,
    }
    setCustomTemplates((current) => ({ ...current, [id]: template }))
    setDraftShift((current) =>
      current
        ? {
            ...current,
            templateId: id,
            end: clampShiftEnd(
              current.start + template.defaultMinutes,
              current.start,
            ),
            note: template.note,
          }
        : current,
    )
    setTemplateDraft(emptyTemplateDraft)
  }

  return {
    draftShift,
    templateDraft,
    adjustmentChanges,
    canCreateDraft: conflictResolution !== null,
    setDraftShift,
    setDraftBaseShifts,
    setTemplateDraft,
    openAssignmentDraft,
    openMemberDraft,
    createDraftShift,
    closeDraftShift,
    createShiftTemplate,
  }
}
