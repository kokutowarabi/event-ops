import {
  useEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import type { Member } from "@/lib/members"
import { operationPeriod } from "@/lib/event-schedule"
import type {
  Shift,
  ShiftData,
  ShiftSchedule,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"
import {
  ShiftAssignmentView,
} from "./shift-assignment-view"
import { useShiftCreationActions } from "./shift-creation-actions"
import { ShiftDesktopView } from "./shift-desktop-view"
import { ShiftDragOverlays } from "./shift-drag-overlays"
import { ShiftFilterPanel } from "./shift-filter-panel"
import { exportShiftCsv } from "./shift-export"
import { ShiftHeader } from "./shift-header"
import { ShiftMobileView } from "./shift-mobile-view"
import { useShiftCopyActions } from "./shift-copy-actions"
import { useShiftMoveActions } from "./shift-move-actions"
import { useShiftResizeActions } from "./shift-resize-actions"
import {
  ShiftAdjustmentDialog,
  ShiftCreationDialog,
  ShiftDetailsDialog,
} from "./shift-dialogs"
import { SHIFT_CREATION_ENABLED } from "./shift-layout"
import type {
  CopyingShift,
  CreatingShift,
  MovingShift,
  PendingMovePress,
  PendingShiftAdjustment,
  ResizingShift,
  ShiftViewMode,
} from "./shift-types"
import {
  ALL_DEPARTMENTS,
  useShiftDerivedData,
} from "./use-shift-derived-data"
import { useShiftFilters } from "./use-shift-filters"
import { useShiftHistory } from "./use-shift-history"
import { useShiftHistoryShortcuts } from "./use-shift-history-shortcuts"
import { useShiftDrafts } from "./use-shift-drafts"
import { useShiftDataSync } from "./use-shift-data-sync"

export type { Shift, ShiftData, ShiftSchedule, ShiftTemplate } from "@/lib/shift-data"

type ShiftManagerProps = {
  members: Member[]
  initialShiftData: ShiftData
  onShiftDataChange: (data: ShiftData) => void
}

export function ShiftManager({ members, initialShiftData, onShiftDataChange }: ShiftManagerProps) {
  const defaultStartDate = operationPeriod.startDate
  const [shiftViewMode, setShiftViewMode] = useState<ShiftViewMode>("member")
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule | null>(initialShiftData.schedule)
  const [selectedDate, setSelectedDate] = useState(initialShiftData.schedule?.startDate ?? defaultStartDate)
  const {
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
  } = useShiftFilters()
  const [pinnedMemberIds, setPinnedMemberIds] = useState<string[]>([])
  const {
    shifts,
    shiftsRef,
    setShiftsWithoutHistory,
    recordHistorySnapshot,
    recordShiftsChange,
    commitShiftPreview,
    undoShifts: restorePreviousShifts,
    redoShifts: restoreNextShifts,
  } = useShiftHistory(initialShiftData.shifts)
  const [customShiftTemplates, setCustomShiftTemplates] = useState<Record<ShiftTemplateId, ShiftTemplate>>(initialShiftData.customShiftTemplates)
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [moving, setMoving] = useState<MovingShift | null>(null)
  const [resizing, setResizing] = useState<ResizingShift | null>(null)
  const [copying, setCopying] = useState<CopyingShift | null>(null)
  const [pendingShiftAdjustment, setPendingShiftAdjustment] = useState<PendingShiftAdjustment | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<{ memberId: string; slot: number } | null>(null)
  const [creatingShift, setCreatingShift] = useState<CreatingShift | null>(null)
  const moveInitialShiftsRef = useRef<Shift[] | null>(null)
  const pendingMovePressRef = useRef<PendingMovePress | null>(null)
  const resizeInitialShiftsRef = useRef<Shift[] | null>(null)
  const createInitialShiftsRef = useRef<Shift[] | null>(null)
  const didMoveShiftRef = useRef(false)
  const didResizeShiftRef = useRef(false)
  useEffect(() => () => {
    const pending = pendingMovePressRef.current
    if (pending) window.clearTimeout(pending.timerId)
  }, [])

  useShiftDataSync({
    initialData: initialShiftData,
    schedule: shiftSchedule,
    shifts,
    customTemplates: customShiftTemplates,
    interactionActive: Boolean(creatingShift || moving || resizing || copying),
    onDataChange: onShiftDataChange,
    setSchedule: setShiftSchedule,
    setCustomTemplates: setCustomShiftTemplates,
    setPendingAdjustment: setPendingShiftAdjustment,
    setShiftsWithoutHistory,
  })

  const isAdmin = true
  const {
    selectedShift,
    allShiftTemplates,
    getShiftTemplateColor,
    memberName,
    departments,
    roles,
    dateTabs,
    scheduledMembers,
    selectedDateShifts,
    visibleSelectedDateShifts,
    visibleMembers,
    visiblePinnedMemberIds,
    visiblePinnedMemberIdSet,
    visiblePinnedMembers,
    exportableShifts,
    filterSummary,
    hasNoFilterResults,
    shiftFilterOptions,
    assignmentCoverage,
  } = useShiftDerivedData({
    members,
    schedule: shiftSchedule,
    selectedDate,
    shifts,
    customTemplates: customShiftTemplates,
    selectedShiftId,
    shiftFilter,
    memberSearch,
    departmentFilter,
    roleFilter,
    pinnedMemberIds,
  })

  const {
    draftShift,
    draftBaseShifts,
    templateDraft,
    adjustmentChanges: draftAdjustmentChanges,
    canCreateDraft,
    setDraftShift,
    setDraftBaseShifts,
    setTemplateDraft,
    openAssignmentDraft,
    createDraftShift,
    closeDraftShift,
    createShiftTemplate,
  } = useShiftDrafts({
    selectedDate,
    scheduledMembers,
    selectedDateShifts,
    shifts,
    templates: allShiftTemplates,
    setCustomTemplates: setCustomShiftTemplates,
    setShiftsWithoutHistory,
    recordHistorySnapshot,
  })
  const movingShift = moving ? shifts.find((shift) => shift.id === moving.id) ?? null : null
  const copyingShift = copying ? shifts.find((shift) => shift.id === copying.sourceId) ?? null : null
  const exportShifts = () =>
    exportShiftCsv(selectedDate, exportableShifts, members, allShiftTemplates)

  const resetShiftInteraction = () => {
    setSelectedShiftId(null)
    setDraftShift(null)
    setDraftBaseShifts(null)
    setMoving(null)
    setResizing(null)
    setPendingShiftAdjustment(null)
  }

  const undoShifts = () => {
    if (restorePreviousShifts()) resetShiftInteraction()
  }

  const redoShifts = () => {
    if (restoreNextShifts()) resetShiftInteraction()
  }

  const updateShift = (id: string, update: Partial<Shift>) => {
    recordShiftsChange((prev) => prev.map((shift) => (shift.id === id ? { ...shift, ...update } : shift)))
  }

  const {
    beginCreateShift,
    moveCreateShift,
    beginCreateMobileShift,
    moveCreateMobileShift,
    finishCreateShift,
    cancelCreateShift,
    getCreatePreview,
    getMobileCreatePreview,
  } = useShiftCreationActions({
    editable: isAdmin,
    hasSchedule: shiftSchedule !== null,
    selectedDate,
    creatingShift,
    shiftsRef,
    initialShiftsRef: createInitialShiftsRef,
    templates: allShiftTemplates,
    setCreatingShift,
    setHoveredSlot,
    setDraftBaseShifts,
    setDraftShift,
    setShiftsWithoutHistory,
  })

  const {
    startMovePress,
    updateMovePress,
    cancelMovePress,
    moveShift,
    stopMove,
    cancelMove,
  } = useShiftMoveActions({
    editable: isAdmin,
    moving,
    shiftsRef,
    initialShiftsRef: moveInitialShiftsRef,
    pendingPressRef: pendingMovePressRef,
    didMoveRef: didMoveShiftRef,
    setMoving,
    setShiftsWithoutHistory,
    commitShiftPreview,
  })

  const { startResize, moveResize, stopResize, cancelResize } = useShiftResizeActions({
    editable: isAdmin,
    resizing,
    shiftsRef,
    initialShiftsRef: resizeInitialShiftsRef,
    didResizeRef: didResizeShiftRef,
    setResizing,
    setPendingAdjustment: setPendingShiftAdjustment,
    setShiftsWithoutHistory,
    commitShiftPreview,
  })

  const { startCopyShift, moveCopyShift, stopCopyShift, cancelCopyShift } = useShiftCopyActions({
    editable: isAdmin,
    shiftsRef,
    setCopying,
    recordShiftsChange,
  })

  const confirmShiftAdjustment = () => {
    if (!pendingShiftAdjustment) return
    recordHistorySnapshot(pendingShiftAdjustment.baseShifts)
    setShiftsWithoutHistory(pendingShiftAdjustment.nextShifts)
    setPendingShiftAdjustment(null)
  }

  const cancelShiftAdjustment = () => {
    setPendingShiftAdjustment(null)
  }

  const closeShiftDetail = () => {
    setSelectedShiftId(null)
  }

  const openShiftDetail = (id: string) => {
    if (didMoveShiftRef.current || didResizeShiftRef.current) {
      didMoveShiftRef.current = false
      didResizeShiftRef.current = false
      return
    }
    setSelectedShiftId(id)
  }

  const deleteSelectedShift = () => {
    if (!selectedShift) return
    recordShiftsChange((prev) => prev.filter((shift) => shift.id !== selectedShift.id))
    closeShiftDetail()
  }

  const toggleMemberPin = (memberId: string) => {
    setPinnedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    )
  }

  useShiftHistoryShortcuts(undoShifts, redoShifts)

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <ShiftHeader
        hasSchedule={shiftSchedule !== null}
        viewMode={shiftViewMode}
        selectedDate={selectedDate}
        dates={dateTabs}
        exportDisabled={exportableShifts.length === 0}
        onViewModeChange={setShiftViewMode}
        onDateChange={setSelectedDate}
        onExport={exportShifts}
      />

      {!shiftSchedule ? (
        <section className="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card p-8 text-center">
          <div>
            <h2 className="font-semibold">シフトデータがありません</h2>
            <p className="mt-2 text-sm text-muted-foreground">運営期間とメンバーの設定を確認してください。</p>
          </div>
        </section>
      ) : (
        <>
          {shiftViewMode === "assignment" ? (
            <ShiftAssignmentView
              groups={assignmentCoverage}
              creationEnabled={SHIFT_CREATION_ENABLED}
              getTemplateColor={getShiftTemplateColor}
              getMemberName={memberName}
              onOpenDraft={openAssignmentDraft}
              onOpenShift={openShiftDetail}
            />
          ) : null}

          <ShiftMobileView
            visible={shiftViewMode === "member"}
            filterSummary={filterSummary}
            filtersOpen={filtersOpen && filterAnchor === "mobile"}
            hasNoFilterResults={hasNoFilterResults}
            pinnedMembers={visiblePinnedMembers}
            members={visibleMembers}
            pinnedMemberIds={visiblePinnedMemberIdSet}
            selectedDateShifts={selectedDateShifts}
            visibleDateShifts={visibleSelectedDateShifts}
            hoveredSlot={hoveredSlot}
            editable={isAdmin}
            templates={allShiftTemplates}
            getTemplateColor={getShiftTemplateColor}
            getCreatePreview={getMobileCreatePreview}
            onToggleFilters={(event) => toggleFilters("mobile", event)}
            onTogglePin={toggleMemberPin}
            onBeginCreate={beginCreateMobileShift}
            onMoveCreate={moveCreateMobileShift}
            onFinishCreate={finishCreateShift}
            onCancelCreate={cancelCreateShift}
            onLeaveTimeline={(memberId) => {
              if (!creatingShift || creatingShift.memberId !== memberId) {
                setHoveredSlot(null)
              }
            }}
            onClearHover={() => setHoveredSlot(null)}
            onOpenShift={openShiftDetail}
          />

          <ShiftDesktopView
            visible={shiftViewMode === "member"}
            filterSummary={filterSummary}
            filtersOpen={filtersOpen && filterAnchor === "table"}
            hasNoFilterResults={hasNoFilterResults}
            members={visibleMembers}
            pinnedMemberIds={visiblePinnedMemberIds}
            pinnedMemberIdSet={visiblePinnedMemberIdSet}
            selectedDateShifts={selectedDateShifts}
            visibleDateShifts={visibleSelectedDateShifts}
            hoveredSlot={hoveredSlot}
            creatingShift={creatingShift}
            moving={moving}
            resizing={resizing}
            copying={copying}
            copyingShift={copyingShift}
            editable={isAdmin}
            templates={allShiftTemplates}
            getTemplateColor={getShiftTemplateColor}
            getCreatePreview={getCreatePreview}
            onToggleFilters={(event) => toggleFilters("table", event)}
            onTogglePin={toggleMemberPin}
            onBeginCreate={beginCreateShift}
            onMoveCreate={moveCreateShift}
            onFinishCreate={finishCreateShift}
            onCancelCreate={cancelCreateShift}
            onLeaveTimeline={(memberId) => {
              if (!creatingShift || creatingShift.memberId !== memberId) {
                setHoveredSlot(null)
              }
            }}
            onClearHover={() => setHoveredSlot(null)}
            onOpenShift={openShiftDetail}
            onStartMovePress={startMovePress}
            onUpdateMovePress={updateMovePress}
            onMoveShift={moveShift}
            onStopMove={stopMove}
            onCancelMovePress={cancelMovePress}
            onCancelMove={cancelMove}
            onStartResize={startResize}
            onMoveResize={moveResize}
            onStopResize={stopResize}
            onCancelResize={cancelResize}
            onStartCopy={startCopyShift}
            onMoveCopy={moveCopyShift}
            onStopCopy={stopCopyShift}
            onCancelCopy={cancelCopyShift}
          />
        </>
      )}

      <ShiftDragOverlays
        moving={moving}
        movingShift={movingShift}
        copying={copying}
        copyingShift={copyingShift}
        templates={allShiftTemplates}
        getTemplateColor={getShiftTemplateColor}
      />

      {filtersOpen && filterPanelPosition
        ? createPortal(
          <ShiftFilterPanel
            panelRef={filterPanelRef}
            position={filterPanelPosition}
            shiftFilter={shiftFilter}
            shiftOptions={shiftFilterOptions}
            memberFilter={memberSearch}
            memberOptions={members.map((member) => member.name)}
            departmentFilter={departmentFilter}
            departmentOptions={departments}
            allDepartmentsValue={ALL_DEPARTMENTS}
            roleFilter={roleFilter}
            roleOptions={roles}
            onShiftFilterChange={setShiftFilter}
            onMemberFilterChange={setMemberSearch}
            onDepartmentFilterChange={setDepartmentFilter}
            onRoleFilterChange={setRoleFilter}
            onClear={clearFilters}
            onClose={closeFilters}
          />,
          document.body,
        )
        : null}

      <ShiftCreationDialog
        draft={draftShift}
        templateDraft={templateDraft}
        members={scheduledMembers}
        templates={allShiftTemplates}
        adjustmentChanges={draftAdjustmentChanges}
        canCreate={canCreateDraft}
        setDraft={setDraftShift}
        setTemplateDraft={setTemplateDraft}
        onCreateTemplate={createShiftTemplate}
        onCreate={createDraftShift}
        onClose={closeDraftShift}
      />

      <ShiftAdjustmentDialog
        pending={pendingShiftAdjustment}
        templates={allShiftTemplates}
        onConfirm={confirmShiftAdjustment}
        onCancel={cancelShiftAdjustment}
      />

      <ShiftDetailsDialog
        open={selectedShiftId !== null}
        shift={selectedShift}
        members={scheduledMembers}
        templates={allShiftTemplates}
        editable={isAdmin}
        onUpdate={updateShift}
        onDelete={deleteSelectedShift}
        onClose={closeShiftDetail}
      />
    </div>
  )
}
