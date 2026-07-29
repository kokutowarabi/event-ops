"use client"

import { ProjectManager } from "@/components/project-manager"
import { useEventOps } from "@/components/dashboard/event-ops-provider"

export function ProjectsView() {
  const { projects, setProjects } = useEventOps()

  return (
    <ProjectManager
      projects={projects}
      onProjectsChange={setProjects}
    />
  )
}
