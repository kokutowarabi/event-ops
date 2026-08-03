import { useCallback, useRef, useState } from "react"
import type { Shift } from "@/lib/shift-data"
import { shiftsEqual } from "./shift-domain"

type ShiftHistory = {
  past: Shift[][]
  future: Shift[][]
}

const HISTORY_LIMIT = 100

export function useShiftHistory(initialShifts: Shift[]) {
  const [shifts, setShifts] = useState(initialShifts)
  const shiftsRef = useRef(shifts)
  const historyRef = useRef<ShiftHistory>({ past: [], future: [] })

  const setShiftsWithoutHistory = useCallback((nextShifts: Shift[]) => {
    shiftsRef.current = nextShifts
    setShifts(nextShifts)
  }, [])

  const recordHistorySnapshot = useCallback((snapshot: Shift[]) => {
    historyRef.current = {
      past: [...historyRef.current.past, snapshot].slice(-HISTORY_LIMIT),
      future: [],
    }
  }, [])

  const recordShiftsChange = useCallback((updater: (current: Shift[]) => Shift[]) => {
    const current = shiftsRef.current
    const next = updater(current)
    if (shiftsEqual(current, next)) return
    recordHistorySnapshot(current)
    setShiftsWithoutHistory(next)
  }, [recordHistorySnapshot, setShiftsWithoutHistory])

  const commitShiftPreview = useCallback((initialSnapshot: Shift[] | null) => {
    if (!initialSnapshot || shiftsEqual(initialSnapshot, shiftsRef.current)) return
    recordHistorySnapshot(initialSnapshot)
  }, [recordHistorySnapshot])

  const undoShifts = useCallback(() => {
    const previous = historyRef.current.past.at(-1)
    if (!previous) return false
    historyRef.current = {
      past: historyRef.current.past.slice(0, -1),
      future: [shiftsRef.current, ...historyRef.current.future],
    }
    setShiftsWithoutHistory(previous)
    return true
  }, [setShiftsWithoutHistory])

  const redoShifts = useCallback(() => {
    const next = historyRef.current.future[0]
    if (!next) return false
    historyRef.current = {
      past: [...historyRef.current.past, shiftsRef.current].slice(-HISTORY_LIMIT),
      future: historyRef.current.future.slice(1),
    }
    setShiftsWithoutHistory(next)
    return true
  }, [setShiftsWithoutHistory])

  return {
    shifts,
    shiftsRef,
    setShiftsWithoutHistory,
    recordHistorySnapshot,
    recordShiftsChange,
    commitShiftPreview,
    undoShifts,
    redoShifts,
  }
}
