import { describe, expect, it } from "vitest"
import {
  getMemberBureau,
  memberDepartmentBadgeClass,
} from "@/lib/member-department"

describe("member department colors", () => {
  it("groups numbered departments under the same bureau", () => {
    expect(getMemberBureau("運営局・第1部門")).toBe("運営局")
    expect(memberDepartmentBadgeClass("運営局・第1部門")).toBe(
      memberDepartmentBadgeClass("運営局・第3部門"),
    )
  })

  it("assigns different colors to different bureaus", () => {
    expect(memberDepartmentBadgeClass("運営局・第1部門")).not.toBe(
      memberDepartmentBadgeClass("演出局・第1部門"),
    )
  })

  it("uses a stable fallback for an unknown bureau", () => {
    expect(memberDepartmentBadgeClass("未設定")).toBe(
      memberDepartmentBadgeClass("その他局"),
    )
  })
})
