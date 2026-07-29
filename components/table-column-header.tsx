import { useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ListFilter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SortOrder = "asc" | "desc"

type SortButtonProps<T extends string> = {
  label: string
  column: T
  sortKey: T
  sortOrder: SortOrder
  onSort: (column: T) => void
}

function SortButton<T extends string>({ label, column, sortKey, sortOrder, onSort }: SortButtonProps<T>) {
  const active = column === sortKey
  const Icon = !active ? ArrowUpDown : sortOrder === "asc" ? ArrowUp : ArrowDown
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={() => onSort(column)}
      aria-label={`${label}を並べ替え`}
    >
      <Icon className={`size-3.5 ${active ? "" : "opacity-45"}`} />
    </Button>
  )
}

type FilterHeaderProps<T extends string> = {
  label: string
  column: T
  value: string[]
  options: string[]
  onChange: (value: string[]) => void
  sortKey: T
  sortOrder: SortOrder
  onSort: (column: T) => void
}

function uniqueOptions(options: string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  return Array.from(new Set(options.filter(Boolean)))
    .filter((option) => !normalizedQuery || option.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.localeCompare(b, "ja"))
}

function FilterHeader<T extends string>({
  label,
  column,
  value,
  options,
  onChange,
  sortKey,
  sortOrder,
  onSort,
}: FilterHeaderProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const visibleOptions = uniqueOptions([...value, ...options], query)
  const active = value.length > 0

  return (
    <div
      className={`relative -m-2 flex h-10 w-[calc(100%+1rem)] min-w-0 items-center gap-1 rounded-md px-2 transition ${
        active ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/35" : ""
      }`}
    >
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {active ? (
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          {value.length}
        </span>
      ) : null}
      <Button
        type="button"
        variant={active ? "secondary" : "ghost"}
        size="icon"
        className="size-7"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          setQuery("")
          setOpen((current) => !current)
        }}
        aria-label={`${label}を絞り込み`}
        aria-expanded={open}
      >
        <ListFilter className="size-3.5" />
      </Button>
      <SortButton label={label} column={column} sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />

      {open ? (
        <div className="absolute left-0 top-0 z-50 w-max min-w-full max-w-80 rounded-md border bg-popover p-2 text-popover-foreground shadow-lg">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder={`${label}を検索`}
            className="h-8 min-w-48 bg-background"
          />
          <div className="mt-2 max-h-[min(70svh,calc(100svh-10rem))] overflow-y-auto overscroll-contain">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const selected = value.includes(option)
                return (
                  <div
                    key={option}
                    className={`mb-0.5 flex min-w-0 items-center rounded-md text-sm transition last:mb-0 ${
                      selected
                        ? "bg-primary/15 font-medium text-primary ring-1 ring-inset ring-primary/30"
                        : "hover:bg-muted"
                    }`}
                  >
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (!selected) onChange([...value, option])
                      }}
                      className="min-w-0 flex-1 px-2 py-1.5 text-left"
                    >
                      <span className="block truncate">{option}</span>
                    </button>
                    {selected ? (
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onChange(value.filter((item) => item !== option))}
                        className="mr-1 grid size-6 shrink-0 place-items-center rounded hover:bg-primary/15"
                        aria-label={`${option}の絞り込みを解除`}
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                )
              })
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">該当なし</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

type SearchHeaderProps<T extends string> = Omit<FilterHeaderProps<T>, "options"> & {
  options?: string[]
}

export function SearchHeader<T extends string>({ options = [], ...props }: SearchHeaderProps<T>) {
  return <FilterHeader {...props} options={options} />
}

export function SelectHeader<T extends string>(props: FilterHeaderProps<T>) {
  return <FilterHeader {...props} />
}
