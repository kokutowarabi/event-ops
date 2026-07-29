import type { SupabaseClient, User } from "@supabase/supabase-js"
import {
  createInitialSharedState,
  isSharedAppState,
  type SharedAppState,
} from "@/lib/initial-data"

export const sharedStateId = "main"

export type SharedStateRow = {
  id: string
  data: SharedAppState
  updated_at: string
  updated_by: string | null
}

export type VisitorVote = {
  device_id: string
  project_id: string
  created_at: string
  updated_at: string
}

export async function loadOrCreateSharedState(client: SupabaseClient, user: User) {
  const { data: existing, error: selectError } = await client
    .from("event_ops_state")
    .select("id,data,updated_at,updated_by")
    .eq("id", sharedStateId)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing && isSharedAppState(existing.data)) return existing as SharedStateRow

  const initialState = createInitialSharedState()
  const { data: inserted, error: insertError } = await client
    .from("event_ops_state")
    .upsert(
      {
        id: sharedStateId,
        data: initialState,
        updated_by: user.id,
      },
      {
        onConflict: "id",
        ignoreDuplicates: true,
      },
    )
    .select("id,data,updated_at,updated_by")
    .single()

  if (!insertError && inserted && isSharedAppState(inserted.data)) {
    return inserted as SharedStateRow
  }

  const { data: concurrentRow, error: retryError } = await client
    .from("event_ops_state")
    .select("id,data,updated_at,updated_by")
    .eq("id", sharedStateId)
    .single()

  if (retryError) throw insertError ?? retryError
  if (!isSharedAppState(concurrentRow.data)) {
    throw new Error("共有データの形式が正しくありません。")
  }
  return concurrentRow as SharedStateRow
}

export async function saveSharedState(
  client: SupabaseClient,
  user: User,
  state: SharedAppState,
) {
  const { data, error } = await client
    .from("event_ops_state")
    .update({
      data: state,
      updated_by: user.id,
    })
    .eq("id", sharedStateId)
    .select("id,data,updated_at,updated_by")
    .single()

  if (error) throw error
  return data as SharedStateRow
}

export async function fetchVisitorVotes(client: SupabaseClient) {
  const { data, error } = await client
    .from("visitor_votes")
    .select("device_id,project_id,created_at,updated_at")
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as VisitorVote[]
}
