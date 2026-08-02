import { useEffect, useRef, type Dispatch, type SetStateAction } from "react"
import type {
  Shift,
  ShiftData,
  ShiftSchedule,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
import type { PendingShiftAdjustment } from "./shift-types"

type ShiftDataSyncOptions = {
  initialData: ShiftData
  schedule: ShiftSchedule | null
  shifts: Shift[]
  customTemplates: Record<ShiftTemplateId, ShiftTemplate>
  interactionActive: boolean
  onDataChange: (data: ShiftData) => void
  setSchedule: Dispatch<SetStateAction<ShiftSchedule | null>>
  setCustomTemplates: Dispatch<
    SetStateAction<Record<ShiftTemplateId, ShiftTemplate>>
  >
  setPendingAdjustment: Dispatch<
    SetStateAction<PendingShiftAdjustment | null>
  >
  setShiftsWithoutHistory: (shifts: Shift[]) => void
}

export function useShiftDataSync({
  initialData,
  schedule,
  shifts,
  customTemplates,
  interactionActive,
  onDataChange,
  setSchedule,
  setCustomTemplates,
  setPendingAdjustment,
  setShiftsWithoutHistory,
}: ShiftDataSyncOptions) {
  const syncedSignatureRef = useRef(JSON.stringify(initialData))
  const emittedSignatureRef = useRef(JSON.stringify(initialData))

  useEffect(() => {
    const nextSignature = JSON.stringify(initialData)
    if (nextSignature === syncedSignatureRef.current) return
    syncedSignatureRef.current = nextSignature
    emittedSignatureRef.current = nextSignature
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setSchedule(initialData.schedule)
      setShiftsWithoutHistory(initialData.shifts)
      setCustomTemplates(initialData.customShiftTemplates)
      setPendingAdjustment(null)
    })
    return () => {
      cancelled = true
    }
  }, [
    initialData,
    setCustomTemplates,
    setPendingAdjustment,
    setSchedule,
    setShiftsWithoutHistory,
  ])

  useEffect(() => {
    if (interactionActive) return
    const nextData = { schedule, shifts, customShiftTemplates: customTemplates }
    const nextSignature = JSON.stringify(nextData)
    if (nextSignature === emittedSignatureRef.current) return
    emittedSignatureRef.current = nextSignature
    onDataChange(nextData)
  }, [
    customTemplates,
    interactionActive,
    onDataChange,
    schedule,
    shifts,
  ])
}
