"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type CheckboxProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function Checkbox({ checked, onCheckedChange, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded border border-input bg-background text-primary transition aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground",
        className,
      )}
    >
      {checked ? <Check className="size-3" /> : null}
    </button>
  )
}
