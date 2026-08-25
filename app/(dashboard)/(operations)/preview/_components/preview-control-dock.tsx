import Link from "next/link"
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react"
import {
  type PointerEvent,
  useId,
  useRef,
  useState,
} from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PreviewDateTimePicker } from "./preview-date-time-picker"

const PANEL_EDGE_OFFSET = 8

const managementRoutes: Array<{
  href: string
  label: string
  icon: LucideIcon
}> = [
    { href: "/roster", label: "名簿", icon: Users },
    { href: "/organizations", label: "参加団体", icon: Building2 },
    { href: "/projects", label: "企画管理", icon: ClipboardList },
    { href: "/shift", label: "シフト", icon: CalendarDays },
    { href: "/vote", label: "投票結果", icon: BarChart3 },
  ]

type DragState = {
  pointerId: number
  startX: number
  startOffset: number
  maxOffset: number
  currentOffset: number
  moved: boolean
}

type PreviewControlDockProps = {
  previewDateTime: string
  onPreviewDateTimeChange: (value: string) => void
  onUseCurrentDateTime: () => void
}

export function PreviewControlDock({
  previewDateTime,
  onPreviewDateTimeChange,
  onUseCurrentDateTime,
}: PreviewControlDockProps) {
  const panelId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const ignoreClickRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState<number | null>(null)

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const maxOffset = Math.max(
      (panelRef.current?.offsetWidth ?? 0) + PANEL_EDGE_OFFSET,
      0,
    )
    const startOffset = open ? 0 : maxOffset
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset,
      maxOffset,
      currentOffset: startOffset,
      moved: false,
    }
    setDragOffset(startOffset)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const updateDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const delta = event.clientX - drag.startX
    const nextOffset = Math.min(
      Math.max(drag.startOffset + delta, 0),
      drag.maxOffset,
    )
    drag.currentOffset = nextOffset
    drag.moved ||= Math.abs(delta) > 4
    setDragOffset(nextOffset)
  }

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    setOpen(drag.moved
      ? drag.currentOffset < drag.maxOffset * 0.75
      : (current) => !current)
    ignoreClickRef.current = true
    dragRef.current = null
    setDragOffset(null)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const cancelDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    ignoreClickRef.current = false
    setDragOffset(null)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const toggleFromHandle = () => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false
      return
    }
    setOpen((current) => !current)
  }

  return (
    <div className="pointer-events-none fixed right-2 top-1/2 z-50 w-[min(20rem,calc(100vw-2rem))] -translate-y-1/2">
      <aside
        ref={panelRef}
        aria-label="サイトプレビュー操作"
        data-state={open ? "open" : "closed"}
        className={cn(
          "pointer-events-auto relative w-full drop-shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none",
          !open && dragOffset === null && "translate-x-[calc(100%+0.5rem)]",
          dragOffset !== null && "transition-none",
        )}
        style={dragOffset === null
          ? undefined
          : { transform: `translateX(${dragOffset}px)` }}
      >
        <button
          type="button"
          aria-label={open ? "プレビュー操作を収納" : "プレビュー操作を開く"}
          aria-controls={panelId}
          aria-expanded={open}
          className="absolute -left-6.75 top-1/2 z-10 flex h-20 w-7 -translate-y-1/2 touch-none cursor-ew-resize items-center justify-center rounded-l-2xl border border-r-0 bg-white text-muted-foreground"
          onPointerDown={startDrag}
          onPointerMove={updateDrag}
          onPointerUp={finishDrag}
          onPointerCancel={cancelDrag}
          onClick={toggleFromHandle}
        >
          {open ? (
            <ChevronRight className="size-5.5" data-icon-motion="slide-right" />
          ) : (
            <ChevronLeft className="size-5.5" data-icon-motion="slide-left" />
          )}
        </button>

        <div
          id={panelId}
          inert={!open}
          aria-hidden={!open}
          className="max-h-[calc(100svh-2rem)] overflow-y-auto rounded-2xl border bg-white p-4 text-popover-foreground"
        >
          <h2 className="font-semibold">プレビュー操作</h2>

          <div className="mt-4 grid gap-2">
            <PreviewDateTimePicker
              value={previewDateTime}
              onChange={onPreviewDateTimeChange}
            />
            <Button type="button" variant="outline" onClick={onUseCurrentDateTime}>
              現在日時を使用
            </Button>
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">管理画面へ移動</p>
            <nav className="grid grid-cols-2 gap-2" aria-label="管理画面へ移動">
              {managementRoutes.map((route) => {
                const Icon = route.icon
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    prefetch
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "justify-start")}
                  >
                    <Icon className="size-4" />
                    {route.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>
    </div>
  )
}
