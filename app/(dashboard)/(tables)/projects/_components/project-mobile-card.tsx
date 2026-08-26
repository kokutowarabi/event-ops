import type { Dispatch, ReactNode, SetStateAction } from "react"
import { TrashIcon } from "@/components/common/trash-icon"
import { EditableSelectCell, EditableTextCell } from "@/components/common/editable-cell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EventProject } from "@/lib/event-data"
import { EVENT_DEPARTMENTS, PROJECT_STATUSES, projectStatusVariants } from "./project-config"

type ProjectUpdate = (update: Partial<Omit<EventProject, "id">>) => void

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

export function ProjectMobileCard({
  project,
  onUpdate,
  onDelete,
}: {
  project: EventProject
  onUpdate: ProjectUpdate
  onDelete: () => void
}) {
  return (
    <article className="w-[min(84vw,24rem)] shrink-0 rounded-xl border bg-card p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <EditableTextCell
          value={project.title}
          placeholder="企画名"
          className="min-w-0 flex-1 font-semibold"
          onCommit={(value) => onUpdate({ title: value })}
        >
          <span className="block truncate">{project.title}</span>
        </EditableTextCell>
        <div className="shrink-0">
          <EditableSelectCell
            value={project.status}
            options={PROJECT_STATUSES}
            onCommit={(value) => onUpdate({ status: value })}
          >
            <Badge variant={projectStatusVariants[project.status]}>{project.status}</Badge>
          </EditableSelectCell>
        </div>
      </header>

      <dl className="mt-4 grid gap-3 text-sm">
        <Field label="参加団体">
          <EditableTextCell value={project.organizationName} placeholder="参加団体" onCommit={(value) => onUpdate({ organizationName: value })} />
        </Field>
        <Field label="部門">
          <EditableSelectCell value={project.department} options={EVENT_DEPARTMENTS} onCommit={(value) => onUpdate({ department: value })} />
        </Field>
        <Field label="会場">
          <EditableTextCell value={project.venue} placeholder="会場" onCommit={(value) => onUpdate({ venue: value })}>
            {project.venue || "未定"}
          </EditableTextCell>
        </Field>
        <Field label="時間">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
            <EditableTextCell value={project.startTime} placeholder="開始" onCommit={(value) => onUpdate({ startTime: value })} />
            <span className="text-muted-foreground">-</span>
            <EditableTextCell value={project.endTime} placeholder="終了" onCommit={(value) => onUpdate({ endTime: value })} />
          </div>
        </Field>
        <Field label="担当">
          <EditableTextCell value={project.owner} placeholder="担当" onCommit={(value) => onUpdate({ owner: value })} />
        </Field>
        <Field label="メモ">
          <EditableTextCell value={project.note} placeholder="メモ" onCommit={(value) => onUpdate({ note: value })} />
        </Field>
      </dl>

      <div className="mt-4 flex justify-end border-t pt-3">
        <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label={`${project.title}を削除`}>
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </article>
  )
}

export function ProjectMobileDraftCard({
  draft,
  onDraftChange,
}: {
  draft: Omit<EventProject, "id">
  onDraftChange: Dispatch<SetStateAction<Omit<EventProject, "id">>>
}) {
  const update = (field: keyof Omit<EventProject, "id">, value: string) =>
    onDraftChange((current) => ({ ...current, [field]: value }))

  return (
    <section aria-label="新しい企画" className="mx-3 mt-4 grid gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <h2 className="font-semibold">新しい企画</h2>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile-project-title">企画名</Label>
        <Input id="mobile-project-title" value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="企画名" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile-project-organization">参加団体</Label>
        <Input id="mobile-project-organization" value={draft.organizationName} onChange={(event) => update("organizationName", event.target.value)} placeholder="参加団体" />
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
