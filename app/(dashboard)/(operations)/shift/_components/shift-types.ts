import type { Dispatch, SetStateAction } from "react"
import type { Shift, ShiftKind, ShiftTemplateId } from "@/lib/shift-data"
import type { ShiftAdjustmentChange } from "./shift-domain"

export type ShiftViewMode = "member" | "assignment"

export type DraftShift = {
  memberId: string
  date: string
  start: number
  end: number
  templateId: ShiftTemplateId
  note: string
}

export type DraftShiftTemplate = {
  label: string
  kind: ShiftKind
  defaultMinutes: number
  note: string
}

export type CreatingShift = {
  memberId: string
  startSlot: number
  currentSlot: number
  adjustedShiftIds: string[]
}

export type ResizeEdge = "start" | "end"

export type ResizingShift = {
  id: string
  edge: ResizeEdge
  originX: number
  originScrollLeft: number
  start: number
  end: number
  adjustedShiftIds: string[]
}

export type MovingShift = {
  id: string
  originX: number
  pointerOffsetX: number
  pointerX: number
  pointerY: number
  start: number
  end: number
  previewStart: number
  previewEnd: number
  previewMemberId: string
  canDrop: boolean
}

export type PendingMovePress = {
  timerId: number
  shift: Shift
  element: HTMLDivElement
  pointerId: number
  clientX: number
  clientY: number
}

export type CopyingShift = {
  sourceId: string
  previewMemberIds: string[]
  targetMemberIds: string[]
  sourceRect: {
    left: number
    top: number
    width: number
    height: number
  }
  stretchRect: {
    left: number
    top: number
    width: number
    height: number
  }
}

export type PendingShiftAdjustment = {
  baseShifts: Shift[]
  nextShifts: Shift[]
  changes: ShiftAdjustmentChange[]
}

export type FilterAnchor = "mobile" | "table"

export type DraftShiftSetter = Dispatch<SetStateAction<DraftShift | null>>
export type DraftShiftTemplateSetter = Dispatch<SetStateAction<DraftShiftTemplate>>
