import type { SupabaseClient } from "@supabase/supabase-js"

export type VisitorVote = {
  device_id: string
  project_id: string
  voted_on: string
  created_at: string
  updated_at: string
}

export async function fetchVisitorVotes(client: SupabaseClient) {
  const { data, error } = await client
    .from("visitor_votes")
    .select("device_id,project_id,voted_on,created_at,updated_at")
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as VisitorVote[]
}

export async function castVisitorVote(
  client: SupabaseClient,
  deviceId: string,
  projectId: string,
  votedOn: string,
) {
  const { data, error } = await client.rpc("cast_visitor_vote", {
    p_device_id: deviceId,
    p_project_id: projectId,
    p_voted_on: votedOn,
  })

  if (error) throw error
  return data !== false
}

export function subscribeToVisitorVotes(
  client: SupabaseClient,
  callbacks: {
    onInsert: (vote: VisitorVote) => void
    onSnapshot: (votes: VisitorVote[]) => void
  },
) {
  let active = true
  const channel = client
    .channel("visitor-votes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "visitor_votes",
      },
      (payload) => {
        if (active) callbacks.onInsert(payload.new as VisitorVote)
      },
    )
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") return
      void fetchVisitorVotes(client)
        .then((votes) => {
          if (active) callbacks.onSnapshot(votes)
        })
        .catch(() => undefined)
    })

  return () => {
    active = false
    void client.removeChannel(channel)
  }
}
