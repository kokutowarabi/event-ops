import { BarChart3 } from "lucide-react"
import { LoadingActions } from "../../../_components/loading-primitives"
import { VoteDataSkeleton } from "./vote-data-skeleton"

export function VoteRouteLoading() {
  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-7xl flex-col px-3 py-4 md:px-4 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <BarChart3 className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">投票結果</h1>
        <LoadingActions includeAdd={false} />
      </header>
      <VoteDataSkeleton />
    </div>
  )
}
