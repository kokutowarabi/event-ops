import type { ComponentProps } from "react"

export function TrashIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-icon-motion="trash"
      aria-hidden="true"
      {...props}
    >
      <g className="trash-icon-body">
        <path d="M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </g>
      <g className="trash-icon-lid">
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </g>
    </svg>
  )
}
