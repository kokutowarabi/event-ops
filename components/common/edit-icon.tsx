import { Pencil } from "lucide-react"
import type { ComponentProps } from "react"

export function EditIcon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={className}
      data-icon-motion="edit"
      aria-hidden="true"
      {...props}
    >
      <span className="edit-icon-trail" />
      <Pencil className="edit-icon-pen relative z-10 size-full" data-icon-motion="edit-pen" />
    </span>
  )
}
