import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation"
import { EventOpsProvider } from "@/components/dashboard/event-ops-provider"
import { createInitialDashboardState } from "@/lib/initial-data"
import { siteConfig } from "@/lib/site-config"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialState = createInitialDashboardState()

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background">
      <nav
        className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4"
        aria-label="管理画面"
      >
        <div className="mr-3 shrink-0">
          <div className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground">
            {siteConfig.universityName}
          </div>
          <div className="text-base font-bold leading-tight">
            {siteConfig.appName}
          </div>
        </div>
        <DashboardNavigation />
      </nav>

      <EventOpsProvider initialState={initialState}>
        <div className="min-h-0 flex-1">{children}</div>
      </EventOpsProvider>
    </main>
  )
}
