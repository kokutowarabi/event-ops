"use client"

import { useCallback, useMemo } from "react"
import { useEventOps } from "../../../_components/event-ops-provider"
import { SitePreview } from "./site-preview"
import { getSupabaseClient } from "@/lib/supabase/client"
import { castVisitorVote } from "@/lib/supabase/votes"

export function SitePreviewView() {
  const { projects } = useEventOps()
  const voteClient = useMemo(() => getSupabaseClient(), [])

  const castPreviewVote = useCallback(
    async (deviceId: string, projectId: string, votedOn: string) => {
      if (!voteClient) throw new Error("Supabase is not configured")
      return castVisitorVote(voteClient, deviceId, projectId, votedOn)
    },
    [voteClient],
  )

  return (
    <SitePreview
      projects={projects}
      votingConfigured={Boolean(voteClient)}
      onVote={castPreviewVote}
    />
  )
}
