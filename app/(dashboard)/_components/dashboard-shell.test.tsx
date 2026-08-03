import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DashboardShell } from "./dashboard-shell"

const navigation = vi.hoisted(() => ({ pathname: "/roster" }))

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  navigation.pathname = "/roster"
})

describe("dashboard shell", () => {
  it("keeps the management navigation on dashboard pages", () => {
    render(<DashboardShell><div>名簿ページ</div></DashboardShell>)

    expect(screen.getByRole("navigation", { name: "管理画面" })).toBeTruthy()
  })

  it("uses a full-screen shell without management chrome for the site preview", () => {
    navigation.pathname = "/preview"
    render(<DashboardShell><div>公式サイト</div></DashboardShell>)

    expect(screen.queryByRole("navigation", { name: "管理画面" })).toBeNull()
    expect(screen.getByText("公式サイト").parentElement?.className).toContain("h-svh")
  })
})
