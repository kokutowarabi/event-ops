"use client"

import { useEffect, useMemo, useState } from "react"
import { ProjectVote } from "@/components/project-vote"
import { useEventOps } from "@/components/dashboard/event-ops-provider"
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client"
import {
  fetchVisitorVotes,
  type VisitorVote,
} from "@/lib/supabase/votes"
import { appendVisitorVote } from "@/lib/votes"

export function VoteResultsView() {
  const { projects } = useEventOps()
  const voteClient = useMemo(() => getSupabaseClient(), [])
  const [votes, setVotes] = useState<VisitorVote[]>([])
  const [votesLoaded, setVotesLoaded] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!voteClient) return
    let active = true

    const loadVotes = async () => {
      try {
        const nextVotes = await fetchVisitorVotes(voteClient)
        if (active) setVotes(nextVotes)
      } catch {
        if (active) setVotes([])
      } finally {
        if (active) setVotesLoaded(true)
      }
    }

    loadVotes()

    const channel = voteClient
      .channel("visitor-votes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visitor_votes",
        },
        (payload) => {
          if (!active) return
          setVotes((currentVotes) =>
            appendVisitorVote(currentVotes, payload.new as VisitorVote),
          )
        },
      )
      .subscribe()

    return () => {
      active = false
      voteClient.removeChannel(channel)
    }
  }, [voteClient])

  return (
    <ProjectVote
      projects={projects}
      votes={votes}
      loading={!votesLoaded}
    />
  )
}
