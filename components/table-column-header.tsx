"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SortOrder = "asc" | "desc"

type SortButtonProps<T extends string> = {
  column: T
  sortKey: T
  sortOrder: SortOrder
  onSort: (column: T) => void
}

function SortButton<T extends string>({ column, sortKey, sortOrder, onSort }: SortButtonProps<T>) {
  const active = column === sortKey
  const Icon = !active ? ArrowUpDown : sortOrder === "asc" ? ArrowUp : ArrowDown
  return (
    <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => onSort(column)}>
      <Icon className={`size-3.5 ${active ? "" : "opacity-45"}`} />
    </Button>
  )
}

type SearchHeaderProps<T extends string> = {
  label: string
  column: T
  value: string
  options?: string[]
  onChange: (value: string) => void
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

export function SearchHeader<T extends string>({
  label,
  column,
  value,
  options = [],
  onChange,
  sortKey,
  sortOrder,
  onSort,
}: SearchHeaderProps<T>) {
  const [open, setOpen] = useState(false)
  const normalizedValue = value.trim().toLowerCase()
  const visibleOptions = uniqueOptions(options, normalizedValue)

  return (
    <div className="relative -m-2 flex h-10 w-[calc(100%+1rem)] min-w-0 items-center gap-1 px-2">
      <span className="min-w-0 flex-1 truncate font-medium">{value || label}</span>
      <Button type="button" variant="ghost" size="icon" className="size-7" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen(true)}>
        <Search className="size-3.5" />
      </Button>
      <SortButton column={column} sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
      {open ? (
        <div className="absolute left-0 top-0 z-50 w-full rounded-md border bg-popover p-2 shadow-lg">
          <Input
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder={label}
            className="h-8 bg-background"
          />
          <div className="mt-2 max-h-[min(70svh,calc(100svh-10rem))] overflow-y-auto overscroll-contain">
            {value ? (
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
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
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
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">該当なし</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

type SelectHeaderProps<T extends string> = {
  label: string
  column: T
  value: string
  allValue: string
  options: string[]
  onChange: (value: string) => void
  sortKey: T
  sortOrder: SortOrder
  onSort: (column: T) => void
}

export function SelectHeader<T extends string>({
  label,
  column,
  value,
  allValue,
  options,
  onChange,
  sortKey,
  sortOrder,
  onSort,
}: SelectHeaderProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const visibleOptions = uniqueOptions([allValue, ...options], query)
  const displayValue = value === allValue ? label : value

  return (
    <div className="relative -m-2 flex h-10 w-[calc(100%+1rem)] min-w-0 items-center gap-1 px-2">
      <span className="min-w-0 flex-1 truncate font-medium">{displayValue}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          setQuery("")
          setOpen(true)
        }}
      >
        <Search className="size-3.5" />
      </Button>
      <SortButton column={column} sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
      {open ? (
        <div className="absolute left-0 top-0 z-50 w-full rounded-md border bg-popover p-2 shadow-lg">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder={label}
            className="h-8 bg-background"
          />
          <div className="mt-2 max-h-[min(70svh,calc(100svh-10rem))] overflow-y-auto overscroll-contain">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
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
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">該当なし</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
