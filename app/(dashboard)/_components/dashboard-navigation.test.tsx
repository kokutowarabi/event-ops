import { cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DashboardNavigation } from "./dashboard-navigation"

const navigation = vi.hoisted(() => ({
  pathname: "/roster",
  prefetch: vi.fn(),
  push: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    prefetch: navigation.prefetch,
    push: navigation.push,
  }),
}))

afterEach(() => {
  cleanup()
  navigation.prefetch.mockClear()
  navigation.push.mockClear()
})

describe("dashboard navigation prefetching", () => {
  it("prefetches every static dashboard route", async () => {
    render(<DashboardNavigation />)

    await waitFor(() => {
      expect(navigation.prefetch).toHaveBeenCalledTimes(6)
    })

    expect(navigation.prefetch.mock.calls.map(([href]) => href)).toEqual([
      "/roster",
      "/organizations",
      "/projects",
      "/shift",
      "/preview",
      "/vote",
    ])
  })
})
