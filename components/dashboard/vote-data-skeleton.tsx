function VoteSkeleton({
  className = "",
}: {
  className?: string
}) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden="true"
    />
  )
}

export function VoteDataSkeleton() {
  return (
    <div
      className="min-h-0 flex-1 overflow-hidden"
      role="status"
      aria-label="投票データを読み込み中"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {["有効投票数", "投票済み端末数", "掲載企画"].map((label) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <VoteSkeleton className="mt-2 h-9 w-16" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {["投票日ごとの投票数", "部門ごとの投票数"].map((title) => (
          <section key={title} className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">{title}</h2>
            <div className="mt-3 grid gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="flex h-11 items-center justify-between rounded-lg border bg-background px-3"
                >
                  <VoteSkeleton className="h-4 w-28" />
                  <VoteSkeleton className="h-5 w-10" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">投票日・部門別ランキング</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          選択した投票日の票だけで、部門内の順位を表示します。
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex h-14 items-center justify-between rounded-lg border bg-background px-3"
            >
              <div className="flex-1">
                <VoteSkeleton className="h-4 w-2/3" />
                <VoteSkeleton className="mt-1.5 h-3 w-1/2 bg-muted/70" />
              </div>
              <VoteSkeleton className="h-5 w-10" />
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">読み込み中</span>
    </div>
  )
}
