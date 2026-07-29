import { ShiftView } from "@/components/dashboard/shift-view"
import { createInitialShiftData } from "@/lib/initial-data"

export default function ShiftPage() {
  return <ShiftView initialShiftData={createInitialShiftData()} />
}
