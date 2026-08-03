import { downloadCsv } from "@/lib/csv"
import type { Member } from "@/lib/members"
import type {
  Shift,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
import { formatTime } from "./shift-domain"

export function exportShiftCsv(
  selectedDate: string,
  shifts: Shift[],
  members: Member[],
  templates: Record<ShiftTemplateId, ShiftTemplate>,
) {
  const membersById = new Map(members.map((member) => [member.id, member]))
  downloadCsv(
    `シフト_${selectedDate}`,
    [
      "日付",
      "氏名",
      "メールアドレス",
      "所属",
      "役職",
      "業務",
      "開始時刻",
      "終了時刻",
      "時間（分）",
      "メモ",
    ],
    shifts.map((shift) => {
      const member = membersById.get(shift.memberId)
      return [
        shift.date,
        member?.name,
        member?.email,
        member?.department,
        member?.role,
        templates[shift.templateId]?.label ?? shift.templateId,
        formatTime(shift.start),
        formatTime(shift.end),
        shift.end - shift.start,
        shift.note,
      ]
    }),
  )
}
