export type ShiftKind = "morning" | "day" | "evening" | "full"

export type ShiftTemplateId = string

export type ShiftTemplate = {
  label: string
  kind: ShiftKind
  defaultMinutes: number
  note: string
}

export type ShiftSchedule = {
  memberIds: string[]
  startDate: string
  endDate: string
}

export type Shift = {
  id: string
  memberId: string
  date: string
  start: number
  end: number
  templateId: ShiftTemplateId
  kind: ShiftKind
  note: string
}

export type ShiftData = {
  schedule: ShiftSchedule | null
  shifts: Shift[]
  customShiftTemplates: Record<ShiftTemplateId, ShiftTemplate>
}
