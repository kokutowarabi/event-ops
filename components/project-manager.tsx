"use client"

import { useMemo, useState } from "react"
import { ClipboardList, Plus, Trash2 } from "lucide-react"
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
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchHeader, SelectHeader } from "@/components/table-column-header"
import { EditableSelectCell, EditableTextCell } from "@/components/editable-cell"
import { type EventDepartment, type EventProject, type ProjectStatus } from "@/lib/event-data"
import { matchesSelectedValues } from "@/lib/table-filters"

const EVENT_DEPARTMENTS: EventDepartment[] = ["模擬店", "屋外ステージ", "教室"]
const statusVariants: Record<ProjectStatus, "default" | "secondary" | "destructive" | "outline"> = {
  確定: "default",
  準備中: "secondary",
  当日対応: "outline",
  要確認: "destructive",
}

const emptyProject: Omit<EventProject, "id"> = {
  title: "",
  organizationName: "",
  department: "教室",
  venue: "",
  startTime: "10:00",
  endTime: "11:00",
  owner: "企画運営",
  status: "準備中",
  note: "",
}

type ProjectSortKey = keyof Omit<EventProject, "id">
type SortOrder = "asc" | "desc"

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":")
  return Number(hour) * 60 + Number(minute)
}

type ProjectManagerProps = {
  projects: EventProject[]
  onProjectsChange: (projects: EventProject[] | ((prev: EventProject[]) => EventProject[])) => void
}

export function ProjectManager({ projects, onProjectsChange }: ProjectManagerProps) {
  const [filters, setFilters] = useState<Record<ProjectSortKey, string[]>>({
    title: [],
    organizationName: [],
    department: [],
    venue: [],
    startTime: [],
    endTime: [],
    owner: [],
    status: [],
    note: [],
  })
  const [sortKey, setSortKey] = useState<ProjectSortKey>("startTime")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [draft, setDraft] = useState(emptyProject)
  const [adding, setAdding] = useState(false)

  const headerOptions = useMemo(
    () => ({
      title: projects.map((project) => project.title),
      organizationName: projects.map((project) => project.organizationName),
      department: projects.map((project) => project.department),
      venue: projects.map((project) => project.venue),
      startTime: projects.flatMap((project) => [project.startTime, project.endTime]),
      owner: projects.map((project) => project.owner),
      status: projects.map((project) => project.status),
      note: projects.map((project) => project.note),
    }),
    [projects],
  )

  const visibleProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const standardKeys = (["title", "organizationName", "department", "venue", "owner", "status", "note"] as ProjectSortKey[])
        const matchesStandardFilters = standardKeys.every((key) =>
          matchesSelectedValues([project[key]], filters[key]),
        )
        const matchesTime = matchesSelectedValues(
          [project.startTime, project.endTime, `${project.startTime}-${project.endTime}`],
          filters.startTime,
        )
        return matchesStandardFilters && matchesTime
      })
      .sort((a, b) => {
        if (sortKey === "startTime") {
          const result =
            timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
            timeToMinutes(a.endTime) - timeToMinutes(b.endTime)
          return sortOrder === "asc" ? result : -result
        }
        const result =
          a[sortKey].localeCompare(b[sortKey], "ja")
        return sortOrder === "asc" ? result : -result
      })
  }, [projects, filters, sortKey, sortOrder])

  const updateFilter = (key: ProjectSortKey, value: string[]) => setFilters((prev) => ({ ...prev, [key]: value }))

  const updateProject = (id: string, update: Partial<Omit<EventProject, "id">>) => {
    onProjectsChange((prev) => prev.map((project) => (project.id === id ? { ...project, ...update } : project)))
  }

  const toggleSort = (key: ProjectSortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const addProject = () => {
    if (!draft.title.trim()) return
    onProjectsChange((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...draft,
        title: draft.title.trim(),
        organizationName: draft.organizationName.trim() || "運営本部",
        venue: draft.venue.trim(),
        owner: draft.owner.trim(),
        note: draft.note.trim(),
      },
    ])
    setDraft(emptyProject)
    setAdding(false)
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 items-center gap-2">
        <ClipboardList className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">企画管理</h1>
        <Button type="button" size="icon" className="ml-2 size-8" onClick={adding ? addProject : () => setAdding(true)} disabled={adding && !draft.title.trim()} aria-label={adding ? "企画を追加" : "追加欄を開く"}>
          <Plus className="size-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="bg-muted/40 hover:bg-muted/40">
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
                      {(["準備中", "確定", "当日対応", "要確認"] as ProjectStatus[]).map((status) => (
                        <SelectItem key={`draft-${status}`} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <SelectHeader label="状態" column="status" value={filters.status} options={["準備中", "確定", "当日対応", "要確認"]} onChange={(value) => updateFilter("status", value)} sortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} />
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
            </TableRow>
          </TableHeader>
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
                    options={["準備中", "確定", "当日対応", "要確認"]}
                    onCommit={(value) => updateProject(project.id, { status: value })}
                  >
                    <Badge variant={statusVariants[project.status]}>{project.status}</Badge>
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
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 shrink-0 text-right text-xs text-muted-foreground">{visibleProjects.length} 件表示中</p>
    </div>
  )
}
