import { useState } from "react"
import { createPortal } from "react-dom"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type FilterPanelPosition = {
  left: number
  top: number
  width: number
  maxHeight: number
}

type ShiftFilterPickerProps = {
  label: string
  value: string
  options: string[]
  allValue?: string
  onChange: (value: string) => void
}

function getSearchOptions(options: string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  return Array.from(new Set(options.filter(Boolean)))
    .filter((option) => !normalizedQuery || option.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.localeCompare(b, "ja"))
}

export function ShiftFilterPicker({
  label,
  value,
  options,
  allValue,
  onChange,
}: ShiftFilterPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [popupPosition, setPopupPosition] = useState<FilterPanelPosition | null>(null)
  const searchableOptions = allValue ? [allValue, ...options] : options
  const visibleOptions = getSearchOptions(searchableOptions, query)
  const displayValue = allValue && value === allValue ? label : value || label

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        aria-expanded={open}
        onClick={(event) => {
          setQuery("")
          if (open) {
            setOpen(false)
            return
          }
          const rect = event.currentTarget.getBoundingClientRect()
          setPopupPosition({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            maxHeight: Math.max(96, window.innerHeight - rect.top - 16),
          })
          setOpen(true)
        }}
      >
        <span className="truncate">{displayValue}</span>
        <Search className="size-4 text-muted-foreground" />
      </Button>
      {open && popupPosition
        ? createPortal(
          <div
            data-shift-filter-picker-popup
            className="fixed z-[70] w-max rounded-md border bg-popover p-2 text-popover-foreground shadow-lg"
            style={{
              left: popupPosition.left,
              top: popupPosition.top,
              minWidth: popupPosition.width,
              maxWidth: `calc(100vw - ${popupPosition.left + 8}px)`,
            }}
          >
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              placeholder={label}
              className="h-8 bg-background"
            />
            <div
              className="mt-2 overflow-y-auto overscroll-contain"
              style={{ maxHeight: Math.max(48, popupPosition.maxHeight - 48) }}
            >
              {!allValue && value ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange("")
                    setOpen(false)
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  検索を解除
                </button>
              ) : null}
              {visibleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {option}
                </button>
              ))}
              {visibleOptions.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">該当なし</div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  )
}

export function ShiftFilterEmptyState({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center p-8 text-center ${className}`}
    >
      <div>
        <p className="font-medium">絞り込み結果がありません</p>
        <p className="mt-1 text-sm text-muted-foreground">
          条件を変更して、もう一度お試しください。
        </p>
      </div>
    </div>
  )
}
