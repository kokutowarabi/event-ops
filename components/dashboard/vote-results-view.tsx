"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ProjectVote,
  type VoteConnectionState,
} from "@/components/project-vote"
import { useEventOps } from "@/components/dashboard/event-ops-provider"
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client"
import {
  fetchVisitorVotes,
  type VisitorVote,
} from "@/lib/supabase/votes"

export function VoteResultsView() {
  const { projects } = useEventOps()
  const voteClient = useMemo(() => getSupabaseClient(), [])
  const [votes, setVotes] = useState<VisitorVote[]>([])
  const [connectionState, setConnectionState] =
    useState<VoteConnectionState>(
      isSupabaseConfigured ? "connecting" : "unconfigured",
    )

  useEffect(() => {
    if (!voteClient) return
    let active = true

    const loadVotes = async () => {
      try {
        const nextVotes = await fetchVisitorVotes(voteClient)
        if (active) setVotes(nextVotes)
      } catch {
        if (active) setConnectionState("error")
      }
    }

    loadVotes()

    const channel = voteClient
      .channel("visitor-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitor_votes",
        },
        loadVotes,
      )
      .subscribe((status) => {
        if (!active) return
        if (status === "SUBSCRIBED") setConnectionState("realtime")
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionState("error")
        }
      })

    return () => {
      active = false
      voteClient.removeChannel(channel)
    }
  }, [voteClient])

  return (
    <ProjectVote
      projects={projects}
      votes={votes}
      connectionState={connectionState}
    />
  )
}
