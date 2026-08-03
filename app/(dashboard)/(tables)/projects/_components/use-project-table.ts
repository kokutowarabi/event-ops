import { useMemo, useState } from "react"
import { downloadCsv } from "@/lib/csv"
import type { EventProject } from "@/lib/event-data"
import { matchesSelectedValues } from "@/lib/table-filters"
import {
  emptyProject,
  type ProjectSortKey,
  type ProjectSortOrder,
} from "./project-config"

type ProjectChangeHandler = (
  projects: EventProject[] | ((current: EventProject[]) => EventProject[]),
) => void

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":")
  return Number(hour) * 60 + Number(minute)
}

export function useProjectTable(
  projects: EventProject[],
  onProjectsChange: ProjectChangeHandler,
) {
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
  const [sortOrder, setSortOrder] = useState<ProjectSortOrder>("asc")
  const [draft, setDraft] = useState(emptyProject)
  const [adding, setAdding] = useState(false)

  const headerOptions = useMemo(
    () => ({
      title: projects.map((project) => project.title),
      organizationName: projects.map((project) => project.organizationName),
      department: projects.map((project) => project.department),
      venue: projects.map((project) => project.venue),
      startTime: projects.flatMap((project) => [
        project.startTime,
        project.endTime,
      ]),
      owner: projects.map((project) => project.owner),
      status: projects.map((project) => project.status),
      note: projects.map((project) => project.note),
    }),
    [projects],
  )

  const visibleProjects = useMemo(
    () =>
      projects
        .filter((project) => {
          const standardKeys: ProjectSortKey[] = [
            "title",
            "organizationName",
            "department",
            "venue",
            "owner",
            "status",
            "note",
          ]
          const matchesStandardFilters = standardKeys.every((key) =>
            matchesSelectedValues([project[key]], filters[key]),
          )
          const matchesTime = matchesSelectedValues(
            [
              project.startTime,
              project.endTime,
              `${project.startTime}-${project.endTime}`,
            ],
            filters.startTime,
          )
          return matchesStandardFilters && matchesTime
        })
        .sort((left, right) => {
          if (sortKey === "startTime") {
            const result =
              timeToMinutes(left.startTime) - timeToMinutes(right.startTime)
              || timeToMinutes(left.endTime) - timeToMinutes(right.endTime)
            return sortOrder === "asc" ? result : -result
          }
          const result = left[sortKey].localeCompare(right[sortKey], "ja")
          return sortOrder === "asc" ? result : -result
        }),
    [filters, projects, sortKey, sortOrder],
  )

  const updateFilter = (key: ProjectSortKey, value: string[]) =>
    setFilters((current) => ({ ...current, [key]: value }))

  const updateProject = (
    id: string,
    update: Partial<Omit<EventProject, "id">>,
  ) => {
    onProjectsChange((current) =>
      current.map((project) =>
        project.id === id ? { ...project, ...update } : project,
      ),
    )
  }

  const toggleSort = (key: ProjectSortKey) => {
    if (sortKey === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const addProject = () => {
    if (!draft.title.trim()) return
    onProjectsChange((current) => [
      ...current,
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

  const exportProjects = () =>
    downloadCsv(
      "企画",
      [
        "企画名",
        "参加団体",
        "部門",
        "会場",
        "開始時刻",
        "終了時刻",
        "担当",
        "状態",
        "メモ",
      ],
      visibleProjects.map((project) => [
        project.title,
        project.organizationName,
        project.department,
        project.venue,
        project.startTime,
        project.endTime,
        project.owner,
        project.status,
        project.note,
      ]),
    )

  return {
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
  }
}
