"use client"

import { useEventOps } from "../../_components/event-ops-provider"
import { ProjectManager } from "./project-manager"

export function ProjectsView() {
  const { projects, setProjects } = useEventOps()

  return (
    <ProjectManager
      projects={projects}
      onProjectsChange={setProjects}
    />
  )
}
