import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type TablePageShellProps = {
  icon: LucideIcon
  title: string
  actions: ReactNode
  footer: ReactNode
  children: ReactNode
}

export function TablePageShell({
  icon: Icon,
  title,
  actions,
  footer,
  children,
}: TablePageShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="mb-4 flex shrink-0 items-center gap-2">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {actions}
      </header>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card [&_tbody_td:not([colspan])]:max-w-72 [&_tbody_td:not([colspan])]:overflow-hidden [&_tbody_td:not([colspan])]:text-ellipsis">
        {children}
      </div>

      <p className="mt-2 shrink-0 text-right text-xs text-muted-foreground">
        {footer}
      </p>
    </div>
  )
}
