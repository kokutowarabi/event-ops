import type { Dispatch, SetStateAction } from "react"
import { MobileCardSection } from "@/components/common/mobile-card-section"
import type { EventProject } from "@/lib/event-data"
import { ProjectMobileCard, ProjectMobileDraftCard } from "./project-mobile-card"

export function groupProjectsByDepartment(projects: EventProject[]) {
  const groups = new Map<string, EventProject[]>()
  projects.forEach((project) => {
    const key = project.department || "部門未設定"
    groups.set(key, [...(groups.get(key) ?? []), project])
  })
  return Array.from(groups, ([department, groupedProjects]) => ({
    department,
    projects: groupedProjects,
  }))
}

export function ProjectsMobileView({
  projects,
  adding,
  draft,
  onDraftChange,
  onUpdateProject,
  onDeleteProject,
}: {
  projects: EventProject[]
  adding: boolean
  draft: Omit<EventProject, "id">
  onDraftChange: Dispatch<SetStateAction<Omit<EventProject, "id">>>
  onUpdateProject: (id: string, update: Partial<Omit<EventProject, "id">>) => void
  onDeleteProject: (project: EventProject) => void
}) {
  const groups = groupProjectsByDepartment(projects)

  return (
    <div className="md:hidden">
      {adding ? <ProjectMobileDraftCard draft={draft} onDraftChange={onDraftChange} /> : null}
      {groups.length === 0 ? (
        <div className="grid min-h-48 place-items-center px-4 text-sm text-muted-foreground">
          該当する企画がありません。
        </div>
      ) : (
        <div className="space-y-5 py-4">
          {groups.map((group) => (
            <MobileCardSection
              key={group.department}
              title={group.department}
              titleId={`mobile-project-${group.department}`}
              countLabel="件"
              scrollerClassName="px-3"
            >
              {group.projects.map((project) => (
                <ProjectMobileCard
                  key={project.id}
                  project={project}
                  onUpdate={(update) => onUpdateProject(project.id, update)}
                  onDelete={() => onDeleteProject(project)}
                />
              ))}
            </MobileCardSection>
          ))}
        </div>
      )}
    </div>
  )
}
