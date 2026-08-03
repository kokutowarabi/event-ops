import { ArrowUpDown, Filter, type LucideIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LOADING_ROWS, LoadingActions, Skeleton } from "../../_components/loading-primitives"
import { TablePageShell } from "./table-page-shell"

export type TableSkeletonColumn = {
  label: string
  className: string
}

export function TablePageSkeleton({
  icon,
  title,
  addLabel,
  columns,
}: {
  icon: LucideIcon
  title: string
  addLabel: string
  columns: TableSkeletonColumn[]
}) {
  return (
    <TablePageShell
      icon={icon}
      title={title}
      actions={<LoadingActions addLabel={addLabel} />}
      footer={<Skeleton className="ml-auto h-3 w-20" />}
    >
      <Table aria-label={`${title}のデータを読み込み中`}>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((column, index) => (
              <TableHead key={`${column.label}-${index}`} className={column.className}>
                {column.label ? (
                  <span className="flex items-center gap-2">
                    {column.label}
                    <Filter className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </span>
                ) : null}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {LOADING_ROWS.map((row) => (
            <TableRow key={row}>
              {columns.map((column, columnIndex) => (
                <TableCell key={`${row}-${columnIndex}`} className={column.className}>
                  <Skeleton
                    className="h-4"
                    style={{ width: `${55 + ((row + columnIndex) * 13) % 35}%` }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <span className="sr-only">読み込み中</span>
    </TablePageShell>
  )
}
