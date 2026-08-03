import type {
  EventDepartment,
  EventOrganization,
  OrganizationStatus,
} from "@/lib/event-data"

export const EVENT_DEPARTMENTS: EventDepartment[] = [
  "模擬店",
  "屋外ステージ",
  "教室",
]

export const ORGANIZATION_STATUSES: OrganizationStatus[] = [
  "申請中",
  "確認中",
  "承認済み",
  "要対応",
]

export const organizationStatusVariants: Record<
  OrganizationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  承認済み: "default",
  確認中: "secondary",
  申請中: "outline",
  要対応: "destructive",
}

export const emptyOrganization: Omit<EventOrganization, "id"> = {
  name: "",
  category: "体験",
  department: "教室",
  representative: "",
  contact: "",
  status: "申請中",
  booth: "",
  note: "",
}

export type OrganizationSortKey = keyof Omit<EventOrganization, "id">
export type OrganizationSortOrder = "asc" | "desc"
