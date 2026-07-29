import { describe, expect, it } from "vitest"
import {
  joinMemberRoles,
  memberRoleBadgeClass,
  parseMemberRoles,
} from "@/lib/member-role"

describe("member roles", () => {
  it("treats delimiter-separated roles independently", () => {
    expect(parseMemberRoles("局長・役員")).toEqual(["局長", "役員"])
  })

  it("trims and de-duplicates roles when joining them", () => {
    expect(joinMemberRoles([" 局長 ", "役員", "局長"])).toBe("局長・役員")
  })

  it("assigns different colors to different roles", () => {
    expect(memberRoleBadgeClass("局長")).not.toBe(memberRoleBadgeClass("役員"))
  })

  it("uses a stable fallback for unknown roles", () => {
    expect(memberRoleBadgeClass("未設定")).toBe(memberRoleBadgeClass("その他"))
  })
})
