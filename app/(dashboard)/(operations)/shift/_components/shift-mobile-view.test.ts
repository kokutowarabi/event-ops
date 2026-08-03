import { describe, expect, it } from "vitest"
import type { Member } from "@/lib/members"
import { groupShiftMembersByDepartment } from "./shift-mobile-view"

const members: Member[] = [
  { id: "1", name: "田中 太郎", email: "tanaka@example.com", department: "執行部", role: "委員長" },
  { id: "2", name: "佐藤 花子", email: "sato@example.com", department: "執行部", role: "副委員長" },
  { id: "3", name: "鈴木 一郎", email: "suzuki@example.com", department: "運営局", role: "局長" },
]

describe("shift mobile member groups", () => {
  it("groups members by department while preserving their order", () => {
    expect(groupShiftMembersByDepartment(members)).toEqual([
      { department: "執行部", members: members.slice(0, 2) },
      { department: "運営局", members: members.slice(2) },
    ])
  })
})
