"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { siteConfig } from "@/lib/site-config"
import { DashboardNavigation } from "./dashboard-navigation"

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const previewingSite = pathname === "/preview" || pathname.startsWith("/preview/")

  if (previewingSite) {
    return <main className="h-svh overflow-hidden bg-[#f7f4ed]">{children}</main>
  }

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

      <div className="min-h-0 flex-1">{children}</div>
    </main>
  )
}
