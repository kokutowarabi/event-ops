"use client"

import { useState } from "react"
import { useEventOps } from "../../_components/event-ops-provider"
import { ShiftManager } from "./shift-manager"
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
