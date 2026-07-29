"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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

export function DashboardNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const activeRoute =
    dashboardRoutes.find((route) => isCurrentRoute(pathname, route.href))
    ?? dashboardRoutes[0]

  return (
    <>
      <select
        value={activeRoute.href}
        onChange={(event) => router.push(event.target.value)}
        className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm md:hidden"
        aria-label="画面を選択"
      >
        {dashboardRoutes.map((route) => (
          <option key={route.href} value={route.href}>
            {route.label}
          </option>
        ))}
      </select>

      <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
        {dashboardRoutes.map((route) => {
          const Icon = route.icon
          const active = isCurrentRoute(pathname, route.href)
          return (
            <Link
              key={route.href}
              href={route.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                buttonVariants({
                  size: "sm",
                  variant: active ? "default" : "ghost",
                }),
              )}
            >
              <Icon className="size-4" />
              {route.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
