import type { RefObject } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShiftFilterPicker, type FilterPanelPosition } from "./shift-filter-ui"

type ShiftFilterPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>
  position: FilterPanelPosition
  shiftFilter: string
  shiftOptions: string[]
  memberFilter: string
  memberOptions: string[]
  departmentFilter: string
  departmentOptions: string[]
  allDepartmentsValue: string
  roleFilter: string
  roleOptions: string[]
  onShiftFilterChange: (value: string) => void
  onMemberFilterChange: (value: string) => void
  onDepartmentFilterChange: (value: string) => void
  onRoleFilterChange: (value: string) => void
  onClear: () => void
  onClose: () => void
}

export function ShiftFilterPanel({
  panelRef,
  position,
  shiftFilter,
  shiftOptions,
  memberFilter,
  memberOptions,
  departmentFilter,
  departmentOptions,
  allDepartmentsValue,
  roleFilter,
  roleOptions,
  onShiftFilterChange,
  onMemberFilterChange,
  onDepartmentFilterChange,
  onRoleFilterChange,
  onClear,
  onClose,
}: ShiftFilterPanelProps) {
  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="シフト絞り込み"
      className="fixed z-50 overflow-y-auto rounded-lg border bg-popover p-5 text-popover-foreground shadow-lg"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">シフト絞り込み</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            表示するメンバーとシフトを条件で絞り込みます。
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="絞り込みカードを閉じる"
        >
          <X className="size-4" data-icon-motion="pop" />
        </Button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FilterField label="担当業務">
          <ShiftFilterPicker
            label="担当業務"
            value={shiftFilter}
            options={shiftOptions}
            onChange={onShiftFilterChange}
          />
        </FilterField>
        <FilterField label="メンバー名">
          <ShiftFilterPicker
            label="メンバー名"
            value={memberFilter}
            options={memberOptions}
            onChange={onMemberFilterChange}
          />
        </FilterField>
        <FilterField label="所属">
          <ShiftFilterPicker
            label="所属"
            value={departmentFilter}
            allValue={allDepartmentsValue}
            options={departmentOptions}
            onChange={onDepartmentFilterChange}
          />
        </FilterField>
        <FilterField label="役職">
          <ShiftFilterPicker
            label="役職"
            value={roleFilter}
            allValue="すべての役職"
            options={roleOptions}
            onChange={onRoleFilterChange}
          />
        </FilterField>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClear}>
          クリア
        </Button>
        <Button type="button" onClick={onClose}>
          適用
        </Button>
      </div>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
