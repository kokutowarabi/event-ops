import type { ComponentProps } from "react"

export function EditIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-icon-motion="edit"
      aria-hidden="true"
      {...props}
    >
      <path className="edit-icon-trail" d="M3 21h10" />
      <g className="edit-icon-pen" fill="none">
        <path d="m4 16 10-10 4 4L8 20H4v-4Z" />
        <path d="m13 7 4 4" />
      </g>
    </svg>
  )
}
