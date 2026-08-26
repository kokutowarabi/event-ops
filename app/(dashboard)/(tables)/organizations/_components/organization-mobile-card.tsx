import type { Dispatch, ReactNode, SetStateAction } from "react"
import { TrashIcon } from "@/components/common/trash-icon"
import { EditableSelectCell, EditableTextCell } from "@/components/common/editable-cell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EventOrganization } from "@/lib/event-data"
import { EVENT_DEPARTMENTS, ORGANIZATION_STATUSES, organizationStatusVariants } from "./organization-config"
import { OrganizationLogo } from "./organization-logo"

type OrganizationUpdate = (update: Partial<Omit<EventOrganization, "id">>) => void

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

export function OrganizationMobileCard({
  organization,
  onUpdate,
  onDelete,
}: {
  organization: EventOrganization
  onUpdate: OrganizationUpdate
  onDelete: () => void
}) {
  return (
    <article className="w-[min(84vw,24rem)] shrink-0 rounded-xl border bg-card p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <OrganizationLogo organization={organization} className="size-16" />
          <EditableTextCell
            value={organization.name}
            placeholder="参加団体名"
            className="min-w-0 flex-1 font-semibold"
            onCommit={(value) => onUpdate({ name: value })}
          >
            <span className="block truncate">{organization.name}</span>
          </EditableTextCell>
        </div>
        <div className="shrink-0">
          <EditableSelectCell
            value={organization.status}
            options={ORGANIZATION_STATUSES}
            onCommit={(value) => onUpdate({ status: value })}
          >
            <Badge variant={organizationStatusVariants[organization.status]}>{organization.status}</Badge>
          </EditableSelectCell>
        </div>
      </header>

      <dl className="mt-4 grid gap-3 text-sm">
        <Field label="種別">
          <EditableTextCell value={organization.category} placeholder="種別" onCommit={(value) => onUpdate({ category: value })} />
        </Field>
        <Field label="部門">
          <EditableSelectCell value={organization.department} options={EVENT_DEPARTMENTS} onCommit={(value) => onUpdate({ department: value })} />
        </Field>
        <Field label="代表者">
          <EditableTextCell value={organization.representative} placeholder="代表者" onCommit={(value) => onUpdate({ representative: value })} />
        </Field>
        <Field label="連絡先">
          <EditableTextCell value={organization.contact} placeholder="連絡先" onCommit={(value) => onUpdate({ contact: value })} />
        </Field>
        <Field label="配置">
          <EditableTextCell value={organization.booth} placeholder="配置" onCommit={(value) => onUpdate({ booth: value })}>
            {organization.booth || "未定"}
          </EditableTextCell>
        </Field>
        <Field label="メモ">
          <EditableTextCell value={organization.note} placeholder="メモ" onCommit={(value) => onUpdate({ note: value })} />
        </Field>
      </dl>

      <div className="mt-4 flex justify-end border-t pt-3">
        <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label={`${organization.name}を削除`}>
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </article>
  )
}

export function OrganizationMobileDraftCard({
  draft,
  onDraftChange,
}: {
  draft: Omit<EventOrganization, "id">
  onDraftChange: Dispatch<SetStateAction<Omit<EventOrganization, "id">>>
}) {
  const update = (field: keyof Omit<EventOrganization, "id">, value: string) =>
    onDraftChange((current) => ({ ...current, [field]: value }))

  return (
    <section aria-label="新しい参加団体" className="mx-3 mt-4 grid gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <h2 className="font-semibold">新しい参加団体</h2>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile-organization-name">参加団体名</Label>
        <Input id="mobile-organization-name" value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="参加団体名" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile-organization-category">種別</Label>
        <Input id="mobile-organization-category" value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="種別" />
      </div>
      <div className="grid gap-1.5">
        <Label>部門</Label>
        <Select value={draft.department} onValueChange={(value) => value && update("department", value)}>
          <SelectTrigger className="w-full bg-background"><SelectValue>{draft.department}</SelectValue></SelectTrigger>
          <SelectContent>{EVENT_DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </section>
  )
}
