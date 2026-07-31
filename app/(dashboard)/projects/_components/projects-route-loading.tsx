import { ClipboardList } from "lucide-react"
import { TableRouteLoading } from "../../_components/loading-primitives"

export function ProjectsRouteLoading() {
  return (
    <TableRouteLoading
      icon={ClipboardList}
      title="企画管理"
      columns={["企画名", "参加団体", "部門", "会場", "時間", "状態"]}
      maxWidthClass="max-w-7xl"
    />
  )
}
