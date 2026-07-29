"use client"

import { useState } from "react"
import { ShiftManager } from "@/components/shift-manager"
import { useEventOps } from "@/components/dashboard/event-ops-provider"
import type { ShiftData } from "@/lib/shift-data"

export function ShiftView({
  initialShiftData,
}: {
  initialShiftData: ShiftData
}) {
  const { members, getShiftData, saveShiftData } = useEventOps()
  const [mountedShiftData] = useState(() => getShiftData(initialShiftData))

  return (
    <ShiftManager
      members={members}
      initialShiftData={mountedShiftData}
      onShiftDataChange={saveShiftData}
    />
  )
}
