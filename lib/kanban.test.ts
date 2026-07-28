import { describe, expect, it } from "vitest"
import type { EventProject } from "@/lib/event-data"
import { groupProjectsByStatus, moveProjectToStatus } from "@/lib/kanban"

const projects: EventProject[] = [
  {
    id: "p1",
    title: "受付",
    organizationName: "運営本部",
    department: "教室",
    venue: "入口",
    startTime: "9:00",
    endTime: "10:00",
    owner: "運営",
    status: "準備中",
    note: "",
  },
  {
    id: "p2",
    title: "ステージ",
    organizationName: "演出局",
    department: "屋外ステージ",
    venue: "メイン",
    startTime: "12:00",
    endTime: "13:00",
    owner: "演出",
    status: "確定",
    note: "",
  },
]

describe("kanban project helpers", () => {
  it("groups projects by status", () => {
    const groups = groupProjectsByStatus(projects)

    expect(groups.find((group) => group.status === "準備中")?.projects).toHaveLength(1)
    expect(groups.find((group) => group.status === "確定")?.projects[0]?.id).toBe("p2")
  })

  it("moves a project to another status", () => {
    const next = moveProjectToStatus(projects, "p1", "要確認")

    expect(next.find((project) => project.id === "p1")?.status).toBe("要確認")
    expect(projects.find((project) => project.id === "p1")?.status).toBe("準備中")
  })
})
