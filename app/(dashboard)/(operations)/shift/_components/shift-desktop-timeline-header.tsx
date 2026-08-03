import type { MouseEvent } from "react"
import { ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SLOT_MINUTES, START_MINUTES, timeOptions } from "./shift-domain"
import { SLOT_WIDTH, TIMELINE_PADDING_WIDTH, TIMELINE_TRACK_WIDTH } from "./shift-layout"
import type { CreatingShift, MovingShift, ResizingShift } from "./shift-types"

type ShiftDesktopTimelineHeaderProps = {
  filterSummary: string
  filtersOpen: boolean
  hoveredSlot: { memberId: string; slot: number } | null
  creatingShift: CreatingShift | null
  moving: MovingShift | null
  resizing: ResizingShift | null
  onToggleFilters: (event: MouseEvent<HTMLButtonElement>) => void
}

const MAJOR_LABEL_HIDE_RANGE_SLOTS = 30 / SLOT_MINUTES

export function ShiftDesktopTimelineHeader({
  filterSummary,
  filtersOpen,
  hoveredSlot,
  creatingShift,
  moving,
  resizing,
  onToggleFilters,
}: ShiftDesktopTimelineHeaderProps) {
  const hoveredSlotIndex =
    creatingShift === null && moving === null && resizing === null
      ? hoveredSlot?.slot ?? null
      : null

  return (
    <>
      <div className="sticky left-0 top-0 z-30 flex h-16 items-center border-b border-r bg-card px-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full min-w-0 justify-start"
          onClick={onToggleFilters}
          title={filterSummary || "絞り込み"}
          aria-expanded={filtersOpen}
        >
          <ListFilter className="size-4" />
          <span className="shrink-0">絞り込み</span>
          {filterSummary ? (
            <span className="min-w-0 truncate border-l pl-2 text-xs font-normal text-muted-foreground">
              {filterSummary}
            </span>
          ) : null}
        </Button>
      </div>
      <div className="sticky top-0 z-20 flex h-16 items-center border-b bg-card">
        <div className="relative h-full" style={{ width: TIMELINE_TRACK_WIDTH }}>
          {timeOptions.map((slot, index) => {
            const isMajor = (slot.minutes - START_MINUTES) % 120 === 0
            const isHovered = hoveredSlotIndex === index
            const hidesNearbyMajorLabel =
              isMajor
              && hoveredSlotIndex !== null
              && hoveredSlotIndex !== index
              && Math.abs(hoveredSlotIndex - index) <= MAJOR_LABEL_HIDE_RANGE_SLOTS
            return (
              <span
                key={`time-slot-${slot.value}`}
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs transition ${isHovered
                  ? "font-semibold text-foreground opacity-100"
                  : isMajor && !hidesNearbyMajorLabel
                    ? "text-muted-foreground opacity-100"
                    : "text-muted-foreground opacity-0"
                }`}
                style={{ left: TIMELINE_PADDING_WIDTH + index * SLOT_WIDTH }}
              >
                {slot.label}
              </span>
            )
          })}
        </div>
      </div>
    </>
  )
}
