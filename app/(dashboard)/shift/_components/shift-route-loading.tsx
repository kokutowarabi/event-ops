import { CalendarDays, Layers3, Users } from "lucide-react"
import {
  LOADING_ROWS,
  LoadingActions,
  Skeleton,
} from "../../_components/loading-primitives"
import { formatCompactDate, operationPeriod } from "@/lib/event-schedule"

export function ShiftRouteLoading() {
  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">シフト管理</h1>
        <div className="flex rounded-md border bg-muted/35 p-0.5 text-sm" aria-hidden="true">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-secondary px-2.5">
            <Users className="size-3.5" />
            個人別
          </span>
          <span className="inline-flex h-7 items-center gap-1.5 px-2.5 text-muted-foreground">
            <Layers3 className="size-3.5" />
            担当業務別
          </span>
        </div>
        <span
          className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-semibold"
          aria-hidden="true"
        >
          <CalendarDays className="size-3.5 text-muted-foreground" />
          {formatCompactDate(operationPeriod.startDate)}
        </span>
        <LoadingActions includeAdd={false} />
      </header>

      <div
        className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card"
        role="status"
        aria-label="シフトデータを読み込み中"
      >
        <div className="flex h-12 items-center gap-3 border-b bg-muted/40 px-4">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="ml-auto h-7 w-24" />
        </div>
        <div className="flex h-9 items-center border-b px-4 text-xs text-muted-foreground">
          <span className="w-52 shrink-0">メンバー</span>
          <span className="flex flex-1 justify-between">
            <span>6:00</span>
            <span>10:00</span>
            <span>14:00</span>
            <span>18:00</span>
            <span>22:00</span>
          </span>
        </div>
        {LOADING_ROWS.map((row) => (
          <div key={row} className="flex h-14 items-center border-b px-4 last:border-b-0">
            <div className="w-52 shrink-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1.5 h-3 w-20 bg-muted/70" />
            </div>
            <div className="relative h-8 flex-1 overflow-hidden rounded bg-muted/25">
              <Skeleton
                className="absolute h-6 rounded"
                style={{
                  left: `${8 + (row % 4) * 7}%`,
                  top: "4px",
                  width: `${24 + (row % 3) * 8}%`,
                }}
              />
            </div>
          </div>
        ))}
        <span className="sr-only">読み込み中</span>
      </div>
    </div>
  )
}
