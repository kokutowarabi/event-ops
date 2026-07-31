import type { CSSProperties } from "react"
import { ArrowUpDown, Download, Filter, Plus, type LucideIcon } from "lucide-react"

export const LOADING_ROWS = Array.from({ length: 8 }, (_, index) => index)

export function Skeleton({
  className = "",
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-muted ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export function LoadingActions({ includeAdd = true }: { includeAdd?: boolean }) {
  return (
    <div
      className={includeAdd ? "ml-2 flex items-center gap-4" : "flex items-center gap-2"}
      aria-hidden="true"
    >
      {includeAdd ? (
        <span className="grid size-8 place-items-center rounded-md bg-primary/15 text-muted-foreground">
          <Plus className="size-4" />
        </span>
      ) : null}
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm text-muted-foreground">
        <Download className="size-4" />
        CSV
      </span>
    </div>
  )
}

export function TableRouteLoading({
  icon: Icon,
  title,
  columns,
  maxWidthClass,
}: {
  icon: LucideIcon
  title: string
  columns: string[]
  maxWidthClass: string
}) {
  return (
    <div className={`mx-auto flex h-[calc(100svh-5.5rem)] ${maxWidthClass} flex-col px-4 py-5 md:py-6`}>
      <header className="mb-4 flex shrink-0 items-center gap-2">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <LoadingActions />
      </header>

      <div
        className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card"
        role="status"
        aria-label={`${title}のデータを読み込み中`}
      >
        <div
          className="grid h-11 min-w-max items-center border-b bg-muted/40"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))` }}
        >
          {columns.map((column) => (
            <div
              key={column}
              className="flex h-full items-center gap-2 border-r px-4 text-sm font-medium last:border-r-0"
            >
              <span>{column}</span>
              <Filter className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="min-w-max">
          {LOADING_ROWS.map((row) => (
            <div
              key={row}
              className="grid h-12 border-b last:border-b-0"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))` }}
            >
              {columns.map((column, columnIndex) => (
                <div
                  key={`${row}-${column}`}
                  className="flex items-center border-r px-4 last:border-r-0"
                >
                  <Skeleton
                    className="h-4"
                    style={{ width: `${55 + ((row + columnIndex) * 13) % 35}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <span className="sr-only">読み込み中</span>
      </div>
    </div>
  )
}
