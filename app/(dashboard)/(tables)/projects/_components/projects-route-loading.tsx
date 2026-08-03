import { ClipboardList } from "lucide-react"
import { TablePageSkeleton } from "../../_components/table-page-skeleton"

export function ProjectsRouteLoading() {
  return (
    <TablePageSkeleton
      icon={ClipboardList}
      title="企画管理"
      addLabel="企画を追加"
      columns={[
        { label: "企画名", className: "min-w-60" },
        { label: "参加団体", className: "hidden min-w-52 md:table-cell" },
        { label: "部門", className: "min-w-36" },
        { label: "会場", className: "min-w-40" },
        { label: "時間", className: "min-w-36" },
        { label: "担当", className: "hidden min-w-40 lg:table-cell" },
        { label: "状態", className: "min-w-36" },
        { label: "メモ", className: "hidden min-w-64 xl:table-cell" },
        { label: "", className: "w-16" },
      ]}
    />
  )
}
