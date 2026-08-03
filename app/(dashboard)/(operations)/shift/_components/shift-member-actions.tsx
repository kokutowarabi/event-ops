import { useState } from "react"
import { Ellipsis, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type ShiftMemberActionsProps = {
  memberName: string
  pinned: boolean
  onTogglePin: () => void
}

export function ShiftMemberActions({
  memberName,
  pinned,
  onTogglePin,
}: ShiftMemberActionsProps) {
  const [open, setOpen] = useState(false)

  const togglePin = () => {
    onTogglePin()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Ellipsis className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        role="dialog"
        aria-label={`${memberName}の操作`}
        align="start"
        sideOffset={-28}
        className="w-56 p-1"
      >
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start"
          onClick={togglePin}
        >
          <Pin className={`size-4 ${pinned ? "fill-current" : ""}`} />
          {pinned ? "固定を解除" : "固定する"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
