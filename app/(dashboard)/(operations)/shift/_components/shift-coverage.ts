import type { Shift, ShiftTemplate, ShiftTemplateId } from "@/lib/shift-data"
import type { AssignmentCoverageGroup } from "./shift-assignment-view"
import { COVERAGE_SLOT_MINUTES, coverageTimeSlots } from "./shift-domain"

export function createAssignmentCoverage(
  templates: Record<ShiftTemplateId, ShiftTemplate>,
  shifts: Shift[],
): AssignmentCoverageGroup[] {
  return Object.entries(templates)
    .map(([templateId, template]) => {
      const typedTemplateId = templateId as ShiftTemplateId
      const assignments = shifts
        .filter((shift) => shift.templateId === typedTemplateId)
        .sort(
          (left, right) =>
            left.start - right.start || left.memberId.localeCompare(right.memberId),
        )
      const slotCounts = coverageTimeSlots.map((slotStart) => {
        const slotEnd = slotStart + COVERAGE_SLOT_MINUTES
        return assignments.filter(
          (shift) => shift.start < slotEnd && shift.end > slotStart,
        ).length
      })
      return {
        templateId: typedTemplateId,
        template,
        assignments,
        slotCounts,
        maxOverlap: Math.max(0, ...slotCounts),
        totalMinutes: assignments.reduce(
          (total, shift) => total + shift.end - shift.start,
          0,
        ),
        memberCount: new Set(assignments.map((shift) => shift.memberId)).size,
      }
    })
    .filter((group) => group.assignments.length > 0)
    .sort(
      (left, right) =>
        right.maxOverlap - left.maxOverlap
        || left.template.label.localeCompare(right.template.label, "ja"),
    )
}
