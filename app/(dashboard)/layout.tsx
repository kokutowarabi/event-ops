import { DashboardShell } from "./_components/dashboard-shell"
import { EventOpsProvider } from "./_components/event-ops-provider"
import { createInitialDashboardState } from "@/lib/initial-data"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialState = createInitialDashboardState()

  return (
    <EventOpsProvider initialState={initialState}>
      <DashboardShell>{children}</DashboardShell>
    </EventOpsProvider>
  )
}
