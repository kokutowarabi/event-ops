import type { VisitorVote } from "@/lib/supabase/votes"

const visitorVotesSelect =
  "device_id,project_id,voted_on,created_at,updated_at"

export async function fetchVisitorVotesSnapshot(): Promise<VisitorVote[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) return []

  const endpoint = new URL("/rest/v1/visitor_votes", supabaseUrl)
  endpoint.searchParams.set("select", visitorVotesSelect)
  endpoint.searchParams.set("order", "created_at.asc")

  const response = await fetch(endpoint, {
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`,
    },
    next: {
      revalidate: 60,
      tags: ["visitor-votes"],
    },
  })

  if (!response.ok) {
    throw new Error(`Visitor votes request failed: ${response.status}`)
  }

  return (await response.json()) as VisitorVote[]
}
