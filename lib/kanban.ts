import type { EventProject, ProjectStatus } from "@/lib/event-data"

export const kanbanStatuses: ProjectStatus[] = ["準備中", "要確認", "当日対応", "確定"]

export function groupProjectsByStatus(projects: EventProject[]) {
  return kanbanStatuses.map((status) => ({
    status,
    projects: projects.filter((project) => project.status === status),
  }))
}

export function moveProjectToStatus(projects: EventProject[], projectId: string, status: ProjectStatus) {
  return projects.map((project) => (project.id === projectId ? { ...project, status } : project))
}
