import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchVisitorVotesSnapshot } from "@/lib/supabase/server-votes"

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  }
  if (originalKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey
  }
})

describe("server vote snapshot", () => {
  it("uses the publishable key and a sixty-second ISR cache", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key"
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify([]), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await fetchVisitorVotesSnapshot()

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0]
    if (!options) throw new Error("Expected fetch options")
    expect(String(url)).toContain("/rest/v1/visitor_votes")
    expect(options.headers).toEqual({
      apikey: "publishable-key",
      Authorization: "Bearer publishable-key",
    })
    expect(options.next).toEqual({
      revalidate: 60,
      tags: ["visitor-votes"],
    })
  })

  it("does not request Supabase when it is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchVisitorVotesSnapshot()).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
