import type { CSSProperties } from "react"
import { Download, Plus } from "lucide-react"

export const LOADING_ROWS = Array.from({ length: 8 }, (_, index) => index)

export function Skeleton({
  className = "",
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-muted ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export function LoadingActions({
  includeAdd = true,
  addLabel = "追加",
}: {
  includeAdd?: boolean
  addLabel?: string
}) {
  return (
    <div
      className={includeAdd ? "ml-2 flex items-center gap-4" : "flex items-center gap-2"}
      aria-hidden="true"
    >
      {includeAdd ? (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/15 px-3 text-sm text-muted-foreground">
          <Plus className="size-4" />
          {addLabel}
        </span>
      ) : null}
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm text-muted-foreground">
        <Download className="size-4" />
        CSV
      </span>
    </div>
  )
}
