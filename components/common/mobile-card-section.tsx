import {
  Children,
  type ReactNode,
  type UIEvent,
  useRef,
  useState,
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

function getActiveCardIndex(scroller: HTMLDivElement) {
  const cards = Array.from(scroller.children) as HTMLElement[]
  if (cards.length === 0) return 0

  const paddingLeft = Number.parseFloat(window.getComputedStyle(scroller).paddingLeft) || 0
  const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  const currentScrollLeft = scroller.scrollLeft

  return cards.reduce((closestIndex, card, index) => {
    const closestSnapLeft = Math.min(
      maxScrollLeft,
      Math.max(0, cards[closestIndex].offsetLeft - paddingLeft),
    )
    const cardSnapLeft = Math.min(
      maxScrollLeft,
      Math.max(0, card.offsetLeft - paddingLeft),
    )
    const closestDistance = Math.abs(closestSnapLeft - currentScrollLeft)
    const cardDistance = Math.abs(cardSnapLeft - currentScrollLeft)
    return cardDistance < closestDistance ? index : closestIndex
  }, 0)
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
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const currentIndex = Math.min(activeIndex, Math.max(cards.length - 1, 0))

  const updateActiveCard = (event: UIEvent<HTMLDivElement>) => {
    setActiveIndex(getActiveCardIndex(event.currentTarget))
  }

  const scrollToCard = (index: number) => {
    const scroller = scrollerRef.current
    const card = scroller?.children[index] as HTMLElement | undefined
    if (!scroller || !card) return

    const paddingLeft = Number.parseFloat(window.getComputedStyle(scroller).paddingLeft) || 0
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
    const targetScrollLeft = Math.min(
      maxScrollLeft,
      Math.max(0, card.offsetLeft - paddingLeft),
    )
    scroller.scrollTo({ left: targetScrollLeft, behavior: "smooth" })
    setActiveIndex(index)
  }

  return (
    <section className={className} aria-labelledby={titleId}>
      <div className={cn("mb-2 flex min-w-0 items-center gap-2 px-3", headerClassName)}>
        <h2 id={titleId} className="shrink-0 font-semibold">
          {title}
        </h2>
        <span className="shrink-0 text-xs text-muted-foreground">
          {cards.length}人
        </span>
        <div
          className="ml-auto flex min-w-0 flex-wrap items-center justify-end"
          aria-label={`${title}のカード位置`}
        >
          {cards.map((_, index) => (
            <button
              key={`${titleId}-position-${index}`}
              type="button"
              className="grid size-3.5 shrink-0 place-items-center rounded-full"
              aria-label={`${title}の${index + 1}枚目を表示`}
              aria-current={index === currentIndex ? "true" : undefined}
              onClick={() => scrollToCard(index)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block rounded-full transition-[width,height,background-color]",
                  index === currentIndex
                    ? "size-2 bg-foreground"
                    : "size-1.5 bg-muted-foreground/30",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div
        ref={scrollerRef}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2",
          scrollerClassName,
        )}
        onScroll={updateActiveCard}
      >
        {cards}
      </div>
    </section>
  )
}
