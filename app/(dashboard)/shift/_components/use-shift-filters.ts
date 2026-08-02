import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import type { FilterPanelPosition } from "./shift-filter-ui"
import type { FilterAnchor } from "./shift-types"
import { ALL_DEPARTMENTS, ALL_ROLES } from "./use-shift-derived-data"

export function useShiftFilters() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterAnchor, setFilterAnchor] = useState<FilterAnchor | null>(null)
  const [filterPanelPosition, setFilterPanelPosition] =
    useState<FilterPanelPosition | null>(null)
  const [shiftFilter, setShiftFilter] = useState("")
  const [memberSearch, setMemberSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState(ALL_DEPARTMENTS)
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES)
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null)
  const filterPanelRef = useRef<HTMLDivElement | null>(null)

  const closeFilters = () => {
    setFiltersOpen(false)
    setFilterAnchor(null)
  }

  const clearFilters = () => {
    setShiftFilter("")
    setMemberSearch("")
    setDepartmentFilter(ALL_DEPARTMENTS)
    setRoleFilter(ALL_ROLES)
  }

  const toggleFilters = (
    anchor: FilterAnchor,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    if (filtersOpen && filterAnchor === anchor) {
      closeFilters()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.max(8, rect.left)
    filterTriggerRef.current = event.currentTarget
    setFilterAnchor(anchor)
    setFilterPanelPosition({
      left,
      top: rect.top,
      width: Math.max(280, Math.min(560, window.innerWidth - left - 16)),
      maxHeight: Math.max(240, window.innerHeight - rect.top - 16),
    })
    setFiltersOpen(true)
  }

  useEffect(() => {
    if (!filtersOpen) return

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        target instanceof Element
        && target.closest("[data-shift-filter-picker-popup]")
      ) return
      if (
        filterPanelRef.current?.contains(target)
        || filterTriggerRef.current?.contains(target)
      ) return
      closeFilters()
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeFilters()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [filtersOpen])

  return {
    filtersOpen,
    filterAnchor,
    filterPanelPosition,
    shiftFilter,
    memberSearch,
    departmentFilter,
    roleFilter,
    filterPanelRef,
    setShiftFilter,
    setMemberSearch,
    setDepartmentFilter,
    setRoleFilter,
    toggleFilters,
    clearFilters,
    closeFilters,
  }
}
