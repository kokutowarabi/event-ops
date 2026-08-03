import type {
  EventProject,
  ProjectStatus,
} from "@/lib/event-data"
import { eventDepartments } from "@/lib/event-data"

export const EVENT_DEPARTMENTS = eventDepartments

export const PROJECT_STATUSES: ProjectStatus[] = [
  "準備中",
  "確定",
  "当日対応",
  "要確認",
]

export const projectStatusVariants: Record<
  ProjectStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  確定: "default",
  準備中: "secondary",
  当日対応: "outline",
  要確認: "destructive",
}

export const emptyProject: Omit<EventProject, "id"> = {
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

export type ProjectSortKey = keyof Omit<EventProject, "id">
export type ProjectSortOrder = "asc" | "desc"
