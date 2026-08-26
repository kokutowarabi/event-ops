import { ClipboardList, Download, Plus } from "lucide-react"
import { TrashIcon } from "@/components/common/trash-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { EditableSelectCell, EditableTextCell } from "@/components/common/editable-cell"
import { SearchHeader, SelectHeader } from "@/components/common/table-column-header"
import { type EventDepartment, type EventProject, type ProjectStatus } from "@/lib/event-data"
import { TablePageHeader } from "../../_components/table-page-header"
import { TablePageShell } from "../../_components/table-page-shell"
import {
  EVENT_DEPARTMENTS,
  PROJECT_STATUSES,
  projectStatusVariants,
} from "./project-config"
import { ProjectsMobileView } from "./projects-mobile-view"
import { useProjectTable } from "./use-project-table"

type ProjectManagerProps = {
  projects: EventProject[]
  onProjectsChange: (projects: EventProject[] | ((prev: EventProject[]) => EventProject[])) => void
}

export function ProjectManager({ projects, onProjectsChange }: ProjectManagerProps) {
  const {
    filters,
    sortKey,
    sortOrder,
    draft,
    adding,
    headerOptions,
    visibleProjects,
    setDraft,
    setAdding,
    updateFilter,
    updateProject,
    toggleSort,
    addProject,
    exportProjects,
  } = useProjectTable(projects, onProjectsChange)

  return (
    <TablePageShell
      icon={ClipboardList}
      title="企画管理"
      footer={`${visibleProjects.length} 件表示中`}
      actions={(
        <>
          <Button type="button" size="sm" className="ml-2" onClick={adding ? addProject : () => setAdding(true)} disabled={adding && !draft.title.trim()}>
            <Plus className="size-4" data-icon-motion="spin" />
            {adding ? "追加を確定" : "企画を追加"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={exportProjects}
            disabled={visibleProjects.length === 0}
          >
            <Download className="size-4" data-icon-motion="bounce" />
            CSV
          </Button>
        </>
      )}
    >
      <ProjectsMobileView
        projects={visibleProjects}
        adding={adding}
        draft={draft}
        onDraftChange={setDraft}
        onUpdateProject={updateProject}
        onDeleteProject={(project) => onProjectsChange((current) => current.filter((item) => item.id !== project.id))}
      />
      <div className="hidden md:block">
        <Table>
          <TablePageHeader>
              <TableHead className="min-w-60">
                {adding ? (
                  <Input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="企画名" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="企画名" column="title" value={filters.title} options={headerOptions.title} onChange={(value) => updateFilter("title", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="hidden min-w-52 md:table-cell">
                {adding ? (
                  <Input value={draft.organizationName} onChange={(event) => setDraft((prev) => ({ ...prev, organizationName: event.target.value }))} placeholder="参加団体" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="参加団体" column="organizationName" value={filters.organizationName} options={headerOptions.organizationName} onChange={(value) => updateFilter("organizationName", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-36">
                {adding ? (
                  <Select value={draft.department} onValueChange={(value) => value && setDraft((prev) => ({ ...prev, department: value as EventDepartment }))}>
                    <SelectTrigger className="h-8 w-full bg-background">
                      <SelectValue>{draft.department}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_DEPARTMENTS.map((department) => (
                        <SelectItem key={`draft-department-${department}`} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <SearchHeader label="部門" column="department" value={filters.department} options={headerOptions.department} onChange={(value) => updateFilter("department", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-40">
                {adding ? (
                  <Input value={draft.venue} onChange={(event) => setDraft((prev) => ({ ...prev, venue: event.target.value }))} placeholder="会場" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="会場" column="venue" value={filters.venue} options={headerOptions.venue} onChange={(value) => updateFilter("venue", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-36">
                {adding ? (
                  <div className="grid grid-cols-2 gap-1">
                    <Input value={draft.startTime} onChange={(event) => setDraft((prev) => ({ ...prev, startTime: event.target.value }))} placeholder="開始" className="h-8 bg-background" />
                    <Input value={draft.endTime} onChange={(event) => setDraft((prev) => ({ ...prev, endTime: event.target.value }))} placeholder="終了" className="h-8 bg-background" />
                  </div>
                ) : (
                  <SearchHeader label="時間" column="startTime" value={filters.startTime} options={headerOptions.startTime} onChange={(value) => updateFilter("startTime", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="hidden min-w-40 lg:table-cell">
                {adding ? (
                  <Input value={draft.owner} onChange={(event) => setDraft((prev) => ({ ...prev, owner: event.target.value }))} placeholder="担当" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="担当" column="owner" value={filters.owner} options={headerOptions.owner} onChange={(value) => updateFilter("owner", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="min-w-36">
                {adding ? (
                  <Select value={draft.status} onValueChange={(value) => value && setDraft((prev) => ({ ...prev, status: value as ProjectStatus }))}>
                    <SelectTrigger className="h-8 w-full bg-background">
                      <SelectValue>{draft.status}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => (
                        <SelectItem key={`draft-${status}`} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <SelectHeader label="状態" column="status" value={filters.status} options={PROJECT_STATUSES} onChange={(value) => updateFilter("status", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="hidden min-w-64 xl:table-cell">
                {adding ? (
                  <Input value={draft.note} onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="メモ" className="h-8 bg-background" />
                ) : (
                  <SearchHeader label="メモ" column="note" value={filters.note} options={headerOptions.note} onChange={(value) => updateFilter("note", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
                )}
              </TableHead>
              <TableHead className="w-16" />
          </TablePageHeader>
          <TableBody>
            {visibleProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <EditableTextCell value={project.title} placeholder="企画名" onCommit={(value) => updateProject(project.id, { title: value })}>
                    <>
                      {project.title}
                      <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">
                        {project.organizationName}
                      </span>
                    </>
                  </EditableTextCell>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  <EditableTextCell value={project.organizationName} placeholder="参加団体" onCommit={(value) => updateProject(project.id, { organizationName: value })} />
                </TableCell>
                <TableCell>
                  <EditableSelectCell value={project.department} options={EVENT_DEPARTMENTS} onCommit={(value) => updateProject(project.id, { department: value })} />
                </TableCell>
                <TableCell>
                  <EditableTextCell value={project.venue} placeholder="会場" onCommit={(value) => updateProject(project.id, { venue: value })}>
                    {project.venue || "未定"}
                  </EditableTextCell>
                </TableCell>
                <TableCell>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                    <EditableTextCell value={project.startTime} placeholder="開始" onCommit={(value) => updateProject(project.id, { startTime: value })} />
                    <span className="text-muted-foreground">-</span>
                    <EditableTextCell value={project.endTime} placeholder="終了" onCommit={(value) => updateProject(project.id, { endTime: value })} />
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  <EditableTextCell value={project.owner} placeholder="担当" onCommit={(value) => updateProject(project.id, { owner: value })} />
                </TableCell>
                <TableCell>
                  <EditableSelectCell
                    value={project.status}
                    options={PROJECT_STATUSES}
                    onCommit={(value) => updateProject(project.id, { status: value })}
                  >
                    <Badge variant={projectStatusVariants[project.status]}>{project.status}</Badge>
                  </EditableSelectCell>
                </TableCell>
                <TableCell className="hidden max-w-72 truncate text-muted-foreground xl:table-cell">
                  <EditableTextCell value={project.note} placeholder="メモ" onCommit={(value) => updateProject(project.id, { note: value })} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onProjectsChange((prev) => prev.filter((item) => item.id !== project.id))}
                      aria-label={`${project.title}を削除`}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TablePageShell>
  )
}
