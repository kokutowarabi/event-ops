import { ListFilter, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SortKey } from "@/lib/members"
import type { RosterFilters } from "./roster-types"

type RosterMobileFiltersProps = {
  open: boolean
  query: string
  filters: RosterFilters
  departments: string[]
  roles: string[]
  visibleCount: number
  onOpenChange: (open: boolean) => void
  onQueryChange: (query: string) => void
  onFilterChange: (key: SortKey, value: string[]) => void
  onClear: () => void
}

function FilterOptions({
  label,
  values,
  selected,
  onChange,
}: {
  label: string
  values: string[]
  selected: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {values.map((value) => {
          const active = selected.includes(value)
          return (
            <Button
              key={value}
              type="button"
              size="xs"
              variant={active ? "default" : "outline"}
              className="shrink-0 snap-start"
              aria-pressed={active}
              onClick={() => onChange(
                active
                  ? selected.filter((item) => item !== value)
                  : [...selected, value],
              )}
            >
              {value}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export function RosterMobileFilters({
  open,
  query,
  filters,
  departments,
  roles,
  visibleCount,
  onOpenChange,
  onQueryChange,
  onFilterChange,
  onClear,
}: RosterMobileFiltersProps) {
  const selectedEntries = (Object.entries(filters) as [SortKey, string[]][])
    .flatMap(([key, values]) => values.map((value) => ({ key, value })))
  const activeCount = selectedEntries.length + (query.trim() ? 1 : 0)

  return (
    <div className="sticky top-0 z-20 border-b bg-card/95 p-3 backdrop-blur">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
      >
        <ListFilter className="size-4" />
        <span>絞り込み</span>
        {activeCount > 0 ? (
          <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
        <span className="ml-auto text-xs font-normal text-muted-foreground">{visibleCount}人</span>
      </Button>

      {open ? (
        <div className="mt-2 grid gap-4 rounded-lg border bg-background p-3 shadow-sm">
          <div className="grid gap-2">
            <Label htmlFor="roster-mobile-query">氏名・メール</Label>
            <Input
              id="roster-mobile-query"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="氏名またはメールを検索"
            />
          </div>
          <FilterOptions
            label="所属"
            values={departments}
            selected={filters.department}
            onChange={(value) => onFilterChange("department", value)}
          />
          <FilterOptions
            label="役職"
            values={roles}
            selected={filters.role}
            onChange={(value) => onFilterChange("role", value)}
          />
          {activeCount > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={onClear}>
              <RotateCcw className="size-4" />
              すべて解除
            </Button>
          ) : null}
        </div>
      ) : null}

      {!open && activeCount > 0 ? (
        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {query.trim() ? (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="shrink-0"
              onClick={() => onQueryChange("")}
            >
              検索: {query}
              <X className="size-3" />
            </Button>
          ) : null}
          {selectedEntries.map(({ key, value }) => (
            <Button
              key={`${key}-${value}`}
              type="button"
              variant="secondary"
              size="xs"
              className="shrink-0"
              onClick={() => onFilterChange(
                key,
                filters[key].filter((item) => item !== value),
              )}
            >
              {value}
              <X className="size-3" />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
