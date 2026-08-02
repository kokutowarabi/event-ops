import { CalendarDays, Check, Download, Layers3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { formatCompactDate, getOperationPeriodLabel } from "@/lib/event-schedule"
import type { ShiftViewMode } from "./shift-types"

type ShiftHeaderProps = {
  hasSchedule: boolean
  viewMode: ShiftViewMode
  selectedDate: string
  dates: string[]
  exportDisabled: boolean
  onViewModeChange: (mode: ShiftViewMode) => void
  onDateChange: (date: string) => void
  onExport: () => void
}

export function ShiftHeader({
  hasSchedule,
  viewMode,
  selectedDate,
  dates,
  exportDisabled,
  onViewModeChange,
  onDateChange,
  onExport,
}: ShiftHeaderProps) {
  return (
    <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
      <CalendarDays className="size-5 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">シフト管理</h1>
      {hasSchedule ? (
        <>
          <div className="flex rounded-md border bg-muted/35 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "member" ? "secondary" : "ghost"}
              className="h-7 px-2.5"
              onClick={() => onViewModeChange("member")}
            >
              <Users className="size-3.5" />
              個人別
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "assignment" ? "secondary" : "ghost"}
              className="h-7 px-2.5"
              onClick={() => onViewModeChange("assignment")}
            >
              <Layers3 className="size-3.5" />
              担当業務別
            </Button>
          </div>
          <Select value={selectedDate} onValueChange={(value) => value !== null && onDateChange(value)}>
            <SelectTrigger className="h-8 w-auto max-w-full bg-background">
              <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                <span>{formatCompactDate(selectedDate)}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="w-max">
              {dates.map((date) => (
                <SelectItem key={date} value={date} hideIndicator className="pr-2 pl-2">
                  <span className="grid size-4 shrink-0 place-items-center">
                    {date === selectedDate ? <Check className="size-4" /> : null}
                  </span>
                  <span className={date === selectedDate ? "font-semibold" : ""}>
                    {formatCompactDate(date)}
                  </span>
                  <span
                    className={`ml-auto text-xs font-normal ${
                      date === selectedDate ? "" : "text-muted-foreground!"
                    }`}
                  >
                    {getOperationPeriodLabel(date)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onExport}
            disabled={exportDisabled}
            title="表示中の日付と絞り込み条件でCSV出力"
          >
            <Download className="size-4" />
            CSV
          </Button>
        </>
      ) : null}
    </header>
  )
}
