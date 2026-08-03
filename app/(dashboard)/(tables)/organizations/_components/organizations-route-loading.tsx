import { Building2 } from "lucide-react"
import { TablePageSkeleton } from "../../_components/table-page-skeleton"

export function OrganizationsRouteLoading() {
  return (
    <TablePageSkeleton
      icon={Building2}
      title="参加団体管理"
      addLabel="団体を追加"
      columns={[
        { label: "参加団体名", className: "min-w-60" },
        { label: "種別", className: "min-w-36" },
        { label: "部門", className: "min-w-36" },
        { label: "代表者", className: "hidden min-w-44 md:table-cell" },
        { label: "配置", className: "min-w-32" },
        { label: "状態", className: "min-w-36" },
        { label: "メモ", className: "hidden min-w-72 lg:table-cell" },
        { label: "", className: "w-16" },
      ]}
    />
  )
}
