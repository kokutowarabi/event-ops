"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import {
  subscribeToVisitorVotes,
  type VisitorVote,
} from "@/lib/supabase/votes"
import { appendVisitorVote } from "@/lib/votes"

export function useRealtimeVisitorVotes(initialVotes: VisitorVote[]) {
  const client = useMemo(() => getSupabaseClient(), [])
  const [votes, setVotes] = useState(initialVotes)

  useEffect(() => {
    if (!client) return
    return subscribeToVisitorVotes(client, {
      onInsert: (vote) =>
        setVotes((currentVotes) => appendVisitorVote(currentVotes, vote)),
      onSnapshot: setVotes,
    })
  }, [client])

  return votes
}
