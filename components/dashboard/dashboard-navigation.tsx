"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  MonitorSmartphone,
  Users,
  type LucideIcon,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DashboardRoute = {
  href: string
  label: string
  icon: LucideIcon
}

const dashboardRoutes: DashboardRoute[] = [
  { href: "/", label: "名簿", icon: Users },
  { href: "/organizations", label: "参加団体", icon: Building2 },
  { href: "/projects", label: "企画", icon: ClipboardList },
  { href: "/shift", label: "シフト", icon: CalendarDays },
  { href: "/preview", label: "サイトプレビュー", icon: MonitorSmartphone },
  { href: "/vote", label: "投票結果", icon: BarChart3 },
]

function isCurrentRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href)
}

function DashboardRouteLink({
  route,
  active,
}: {
  route: DashboardRoute
  active: boolean
}) {
  const Icon = route.icon

  return (
    <Link
      href={route.href}
      prefetch
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({
          size: "sm",
          variant: active ? "default" : "ghost",
        }),
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {route.label}
    </Link>
  )
}

function MobileDashboardNavigation({
  activeRoute,
}: {
  activeRoute: DashboardRoute
}) {
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    dashboardRoutes.forEach((route) => router.prefetch(route.href))
  }, [router])

  return (
    <div className="relative min-w-0 flex-1 md:hidden">
      <select
        value={pendingHref ?? activeRoute.href}
        onChange={(event) => {
          const href = event.target.value
          if (href === activeRoute.href) return
          setPendingHref(href)
          router.push(href)
        }}
        className="h-8 w-full rounded-lg border border-input bg-background px-2 pr-8 text-sm"
        aria-label="画面を選択"
      >
        {dashboardRoutes.map((route) => (
          <option key={route.href} value={route.href}>
            {route.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function DashboardNavigation() {
  const pathname = usePathname()
  const activeRoute =
    dashboardRoutes.find((route) => isCurrentRoute(pathname, route.href))
    ?? dashboardRoutes[0]

  return (
    <>
      <MobileDashboardNavigation key={pathname} activeRoute={activeRoute} />

      <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
        {dashboardRoutes.map((route) => {
          const active = isCurrentRoute(pathname, route.href)
          return (
            <DashboardRouteLink
              key={route.href}
              route={route}
              active={active}
            />
          )
        })}
      </div>
    </>
  )
}
