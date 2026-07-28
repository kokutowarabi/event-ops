"use client"

import { Columns3, GripVertical } from "lucide-react"
import type { DragEvent } from "react"
import { Badge } from "@/components/ui/badge"
import type { EventProject, ProjectStatus } from "@/lib/event-data"
import { groupProjectsByStatus, moveProjectToStatus } from "@/lib/kanban"

type KanbanBoardProps = {
  projects: EventProject[]
  onProjectsChange: (projects: EventProject[] | ((prev: EventProject[]) => EventProject[])) => void
}

export function KanbanBoard({ projects, onProjectsChange }: KanbanBoardProps) {
  const groups = groupProjectsByStatus(projects)

  const startDrag = (event: DragEvent<HTMLElement>, projectId: string) => {
    event.dataTransfer.setData("text/plain", projectId)
    event.dataTransfer.effectAllowed = "move"
  }

  const dropOnStatus = (event: DragEvent<HTMLElement>, status: ProjectStatus) => {
    event.preventDefault()
    const projectId = event.dataTransfer.getData("text/plain")
    if (!projectId) return
    onProjectsChange((prev) => moveProjectToStatus(prev, projectId, status))
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 items-center gap-2">
        <Columns3 className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">カンバン</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid min-w-[68rem] grid-cols-4 gap-3">
          {groups.map((group) => (
            <section
              key={group.status}
              className="flex min-h-[32rem] flex-col rounded-lg border bg-card"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropOnStatus(event, group.status)}
            >
              <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
                <h2 className="font-semibold">{group.status}</h2>
                <Badge variant="secondary">{group.projects.length}</Badge>
              </div>
              <div className="grid gap-2 p-3">
                {group.projects.map((project) => (
                  <article
                    key={project.id}
                    draggable
                    onDragStart={(event) => startDrag(event, project.id)}
                    className="cursor-grab rounded-lg border bg-background p-3 shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">{project.title}</h3>
                        <div className="mt-1 text-xs text-muted-foreground">{project.organizationName}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="outline">{project.department}</Badge>
                      <Badge variant="secondary">{project.startTime}-{project.endTime}</Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.note || project.venue}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
