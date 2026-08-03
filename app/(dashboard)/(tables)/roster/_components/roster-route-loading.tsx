import { Users } from "lucide-react"
import { TablePageSkeleton } from "../../_components/table-page-skeleton"

export function RosterRouteLoading() {
  return (
    <TablePageSkeleton
      icon={Users}
      title="名簿"
      addLabel="メンバーを追加"
      columns={[
        { label: "氏名", className: "min-w-56" },
        { label: "メールアドレス", className: "hidden min-w-64 md:table-cell" },
        { label: "所属", className: "min-w-44" },
        { label: "役職", className: "hidden min-w-44 sm:table-cell" },
        { label: "", className: "w-22" },
      ]}
    />
  )
}
