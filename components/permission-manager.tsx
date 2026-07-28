"use client"

import { ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { appViews, type AppView, type PermissionSettings } from "@/lib/permissions"
import type { Member } from "@/lib/members"

const viewLabels: Record<AppView, string> = {
  official: "公式サイト",
  shift: "シフト",
  roster: "名簿",
  organizations: "団体",
  projects: "企画",
  permissions: "権限",
  dtp: "DTP",
  kanban: "カンバン",
  vote: "投票",
  campus: "キャンパス",
  camera: "カメラ",
}

type PermissionManagerProps = {
  members: Member[]
  settings: PermissionSettings
  onSettingsChange: (settings: PermissionSettings) => void
}

function addUnique(items: string[], value: string) {
  const trimmed = value.trim()
  if (!trimmed || items.includes(trimmed)) return items
  return [...items, trimmed]
}

function toggleView(views: AppView[], view: AppView) {
  return views.includes(view) ? views.filter((item) => item !== view) : [...views, view]
}

export function PermissionManager({ members, settings, onSettingsChange }: PermissionManagerProps) {
  const update = (next: Partial<PermissionSettings>) => onSettingsChange({ ...settings, ...next })

  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 items-center gap-2">
        <ShieldCheck className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">権限管理</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
          <section className="grid gap-4">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-semibold">所属の種類</h2>
              <div className="mt-3 grid gap-2">
                {settings.departments.map((department) => (
                  <div key={department} className="flex items-center gap-2">
                    <Input
                      value={department}
                      onChange={(event) =>
                        update({ departments: settings.departments.map((item) => (item === department ? event.target.value : item)) })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => update({ departments: settings.departments.filter((item) => item !== department) })}
                      aria-label={`${department}を削除`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Input
                  placeholder="所属を追加してEnter"
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    update({ departments: addUnique(settings.departments, event.currentTarget.value) })
                    event.currentTarget.value = ""
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-semibold">役職の種類</h2>
              <div className="mt-3 grid gap-2">
                {settings.roles.map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <Input
                      value={role}
                      onChange={(event) => {
                        const nextRole = event.target.value
                        const rolePermissions = { ...settings.rolePermissions }
                        rolePermissions[nextRole] = rolePermissions[role] ?? []
                        delete rolePermissions[role]
                        update({
                          roles: settings.roles.map((item) => (item === role ? nextRole : item)),
                          rolePermissions,
                        })
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => update({ roles: settings.roles.filter((item) => item !== role) })}
                      aria-label={`${role}を削除`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Input
                  placeholder="役職を追加してEnter"
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    update({ roles: addUnique(settings.roles, event.currentTarget.value) })
                    event.currentTarget.value = ""
                  }}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-semibold">役職ごとの権限</h2>
              <div className="mt-3 grid gap-3">
                {settings.roles.map((role) => {
                  const views = settings.rolePermissions[role] ?? []
                  return (
                    <div key={role} className="rounded-md border bg-background p-3">
                      <div className="mb-2 font-medium">{role}</div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {appViews.map((view) => (
                          <Label key={`${role}-${view}`} className="flex items-center gap-2 text-sm font-normal">
                            <Checkbox
                              checked={views.includes(view)}
                              onCheckedChange={() =>
                                update({
                                  rolePermissions: {
                                    ...settings.rolePermissions,
                                    [role]: toggleView(views, view),
                                  },
                                })
                              }
                            />
                            {viewLabels[view]}
                          </Label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-semibold">メンバー個別の権限</h2>
              <div className="mt-3 grid gap-3">
                {members.map((member) => {
                  const inheritedViews = settings.rolePermissions[member.role] ?? []
                  const views = settings.memberPermissions[member.id] ?? inheritedViews
                  return (
                    <details key={member.id} className="rounded-md border bg-background p-3">
                      <summary className="cursor-pointer font-medium">
                        {member.name}
                        <span className="ml-2 text-xs text-muted-foreground">{member.department} / {member.role}</span>
                      </summary>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {appViews.map((view) => (
                          <Label key={`${member.id}-${view}`} className="flex items-center gap-2 text-sm font-normal">
                            <Checkbox
                              checked={views.includes(view)}
                              onCheckedChange={() =>
                                update({
                                  memberPermissions: {
                                    ...settings.memberPermissions,
                                    [member.id]: toggleView(views, view),
                                  },
                                })
                              }
                            />
                            {viewLabels[view]}
                          </Label>
                        ))}
                      </div>
                      {settings.memberPermissions[member.id] ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            const memberPermissions = { ...settings.memberPermissions }
                            delete memberPermissions[member.id]
                            update({ memberPermissions })
                          }}
                        >
                          役職設定に戻す
                        </Button>
                      ) : null}
                    </details>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
