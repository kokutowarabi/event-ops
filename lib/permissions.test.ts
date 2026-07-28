import { describe, expect, it } from "vitest"
import { defaultPermissionSettings, getAllowedViewsForAccount } from "@/lib/permissions"
import type { Member } from "@/lib/members"

const members: Member[] = [
  { id: "member-1", name: "Member One", email: "one@example.com", department: "運営局・〇〇部門", role: "部門長" },
]

describe("getAllowedViewsForAccount", () => {
  it("allows admins to access every admin view", () => {
    const views = getAllowedViewsForAccount({ id: "admin", role: "admin" }, members, defaultPermissionSettings)

    expect(views).toContain("permissions")
    expect(views).toContain("dtp")
    expect(views).toContain("kanban")
  })

  it("uses member-specific permissions before role permissions", () => {
    const views = getAllowedViewsForAccount(
      { id: "member-1", role: "member" },
      members,
      {
        ...defaultPermissionSettings,
        memberPermissions: { "member-1": ["official", "dtp"] },
      },
    )

    expect(views).toEqual(["official", "dtp"])
  })
})
