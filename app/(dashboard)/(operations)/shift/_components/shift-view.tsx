"use client"

import { useState } from "react"
import { useEventOps } from "../../../_components/event-ops-provider"
import { ShiftManager } from "./shift-manager"
import type { ShiftData } from "@/lib/shift-data"

export function ShiftView({
  initialShiftData,
}: {
  initialShiftData: ShiftData
}) {
  const {
    members,
    memberMemos,
    getShiftData,
    saveShiftData,
    setMemberMemo,
  } = useEventOps()
  const [mountedShiftData] = useState(() => getShiftData(initialShiftData))

  return (
    <ShiftManager
      members={members}
      memberMemos={memberMemos}
      initialShiftData={mountedShiftData}
      onShiftDataChange={saveShiftData}
      onMemberMemoChange={setMemberMemo}
    />
  )
}
