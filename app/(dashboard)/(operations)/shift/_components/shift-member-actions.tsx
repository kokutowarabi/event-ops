import { useId, useState } from "react"
import { CircleEllipsis, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
        <CircleEllipsis className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        role="dialog"
        aria-label={`${memberName}の操作`}
        align="start"
        sideOffset={-28}
        className="w-64 p-0"
      >
        <div className="p-3">
          <Label htmlFor={memoId}>メモ</Label>
          <Input
            id={memoId}
            value={memo}
            onChange={(event) => onMemoChange(event.target.value)}
            placeholder="メモを入力"
            autoFocus
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
