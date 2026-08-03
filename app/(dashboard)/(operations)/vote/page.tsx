import { Suspense } from "react"
import {
  VoteResultsLoadingView,
  VoteResultsView,
} from "./_components/vote-results-view"
import { fetchVisitorVotesSnapshot } from "@/lib/supabase/server-votes"
import type { VisitorVote } from "@/lib/supabase/votes"

export const revalidate = 60

async function VoteResultsData() {
  let initialVotes: VisitorVote[]
  try {
    initialVotes = await fetchVisitorVotesSnapshot()
  } catch {
    initialVotes = []
  }
  return <VoteResultsView initialVotes={initialVotes} />
}

export default function VotePage() {
  return (
    <Suspense fallback={<VoteResultsLoadingView />}>
      <VoteResultsData />
    </Suspense>
  )
}
