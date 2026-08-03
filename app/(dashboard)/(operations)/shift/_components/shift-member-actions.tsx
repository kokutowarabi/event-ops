import { useCallback, useEffect, useId, useRef, useState } from "react"
import { CircleEllipsis, Pin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const HOVER_CLOSE_DELAY_MS = 120
const DESKTOP_VIEWPORT_QUERY = "(min-width: 768px)"

function usesHoverInteraction() {
  return window.matchMedia(DESKTOP_VIEWPORT_QUERY).matches
}

type ShiftMemberActionsProps = {
  memberName: string
  memo: string
  pinned: boolean
  onTogglePin: () => void
  onMemoChange: (memo: string) => void
}

export function ShiftMemberActions({
  memberName,
  memo,
  pinned,
  onTogglePin,
  onMemoChange,
}: ShiftMemberActionsProps) {
  const [open, setOpen] = useState(false)
  const memoId = useId()
  const closeTimerRef = useRef<number | null>(null)

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const openOnHover = () => {
    if (!usesHoverInteraction()) return
    cancelScheduledClose()
    setOpen(true)
  }

  const scheduleClose = useCallback(() => {
    if (!usesHoverInteraction()) return
    cancelScheduledClose()
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, HOVER_CLOSE_DELAY_MS)
  }, [cancelScheduledClose])

  useEffect(() => cancelScheduledClose, [cancelScheduledClose])

  const togglePin = () => {
    onTogglePin()
    if (usesHoverInteraction()) setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        const keepsMobileCardOpen =
          !nextOpen
          && !usesHoverInteraction()
          && eventDetails.reason !== "escape-key"
          && eventDetails.reason !== "close-press"
        if (!keepsMobileCardOpen) setOpen(nextOpen)
      }}
    >
      <span
        className="inline-flex"
        onPointerEnter={openOnHover}
        onPointerLeave={scheduleClose}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              size="icon-sm"
              variant={pinned ? "secondary" : "ghost"}
              aria-label={`${memberName}の操作`}
            />
          }
        >
          <CircleEllipsis className="size-4" />
        </PopoverTrigger>
      </span>
      <PopoverContent
        role="dialog"
        aria-label={`${memberName}の操作`}
        align="start"
        sideOffset={-28}
        className="relative w-64 p-0"
        onPointerEnter={cancelScheduledClose}
        onPointerLeave={scheduleClose}
      >
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="absolute right-2 top-2 md:hidden"
          aria-label={`${memberName}の操作を閉じる`}
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
        <div className="p-3">
          <Label htmlFor={memoId}>メモ</Label>
          <Input
            id={memoId}
            value={memo}
            onChange={(event) => onMemoChange(event.target.value)}
            placeholder="メモを入力"
            className="mt-2"
          />
        </div>
        <div className="border-t p-1">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={togglePin}
          >
            <Pin className={`size-4 ${pinned ? "fill-current" : ""}`} />
            {pinned ? "固定を解除" : "固定する"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
