import {
  Children,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

type MobileCardSectionProps = {
  title: string
  titleId: string
  children: ReactNode
  className?: string
  headerClassName?: string
  scrollerClassName?: string
}

export function MobileCardSection({
  title,
  titleId,
  children,
  className,
  headerClassName,
  scrollerClassName,
}: MobileCardSectionProps) {
  const cards = Children.toArray(children)

  return (
    <section className={className} aria-labelledby={titleId}>
      <div className={cn("mb-2 flex min-w-0 items-center gap-2 px-3", headerClassName)}>
        <h2 id={titleId} className="shrink-0 font-semibold">
          {title}
        </h2>
        <span className="shrink-0 text-xs text-muted-foreground">
          {cards.length}人
        </span>
      </div>
      <div
        className={cn(
          "flex gap-3 overflow-x-auto overscroll-x-contain pb-2",
          scrollerClassName,
        )}
      >
        {cards}
      </div>
    </section>
  )
}
