const loadingRows = Array.from({ length: 7 }, (_, index) => index)

export default function DashboardLoading() {
  return (
    <div
      className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-4 p-4 md:p-6"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div className="flex items-center gap-3">
        <div className="size-5 animate-pulse rounded bg-muted" />
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-20 animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-20 animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-20 animate-pulse rounded-xl border bg-muted/40" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
        <div className="h-11 animate-pulse border-b bg-muted/60" />
        {loadingRows.map((row) => (
          <div
            key={row}
            className="flex h-12 items-center gap-4 border-b px-4 last:border-b-0"
          >
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted/80" />
            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted/60" />
          </div>
        ))}
      </div>
      <span className="sr-only">読み込み中</span>
    </div>
  )
}
