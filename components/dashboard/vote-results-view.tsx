"use client"

import { ProjectVote } from "@/components/project-vote"
import { useEventOps } from "@/components/dashboard/event-ops-provider"
import type { VisitorVote } from "@/lib/supabase/votes"
import { useRealtimeVisitorVotes } from "@/lib/supabase/use-realtime-visitor-votes"

export function VoteResultsView({
  initialVotes,
}: {
  initialVotes: VisitorVote[]
}) {
  const { projects } = useEventOps()
  const votes = useRealtimeVisitorVotes(initialVotes)

  return (
    <ProjectVote
      projects={projects}
      votes={votes}
    />
  )
}

export function VoteResultsLoadingView() {
  const { projects } = useEventOps()

  return (
    <ProjectVote
      projects={projects}
      votes={[]}
      loading
    />
  )
}
