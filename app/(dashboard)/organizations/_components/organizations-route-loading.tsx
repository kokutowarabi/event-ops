import { Building2 } from "lucide-react"
import { TableRouteLoading } from "../../_components/loading-primitives"

export function OrganizationsRouteLoading() {
  return (
    <TableRouteLoading
      icon={Building2}
      title="参加団体管理"
      columns={["参加団体名", "種別", "部門", "代表者", "配置", "状態", "メモ"]}
      maxWidthClass="max-w-7xl"
    />
  )
}
