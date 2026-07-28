"use client"

import { Download, FileText, Palette, Printer, ZoomIn, ZoomOut } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EventOrganization, EventProject } from "@/lib/event-data"

type DtpStudioProps = {
  organizations: EventOrganization[]
  projects: EventProject[]
}

const pageSizes = {
  A4: { width: 794, height: 1123 },
  B5: { width: 688, height: 976 },
}

const themes = {
  mono: { label: "Mono", accent: "#111111", paper: "#ffffff", soft: "#f4f4f5" },
  festival: { label: "Festival", accent: "#dc2626", paper: "#fff7ed", soft: "#ffedd5" },
  blue: { label: "Blue", accent: "#2563eb", paper: "#eff6ff", soft: "#dbeafe" },
}

export function DtpStudio({ organizations, projects }: DtpStudioProps) {
  const [pageSize, setPageSize] = useState<keyof typeof pageSizes>("A4")
  const [zoom, setZoom] = useState(0.72)
  const [title, setTitle] = useState("企画パンフレット")
  const [subtitle, setSubtitle] = useState("和泉キャンパスを歩くための公式ガイド")
  const [issue, setIssue] = useState("第140回 架空明大祭")
  const [theme, setTheme] = useState<keyof typeof themes>("mono")
  const [columns, setColumns] = useState(2)
  const [margin, setMargin] = useState(56)
  const [fontScale, setFontScale] = useState(1)
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "")
  const [copyOverrides, setCopyOverrides] = useState<Record<string, string>>({})
  const size = pageSizes[pageSize]
  const colors = themes[theme]

  const projectCards = useMemo(() => {
    return projects.map((project) => {
      const organization = organizations.find((item) => item.name === project.organizationName)
      return { project, organization }
    })
  }, [organizations, projects])

  const exportHtml = () => {
    const content = document.getElementById("dtp-document")?.outerHTML
    if (!content) return
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>EventOps DTP Export</title><style>body{margin:0;background:#eee;font-family:system-ui,sans-serif}.dtp-page{margin:24px auto;background:white;box-shadow:none}</style></head><body>${content}</body></html>`
    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "eventops-dtp.html"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0]
  const updateProjectCopy = (projectId: string, value: string) => {
    setCopyOverrides((prev) => ({ ...prev, [projectId]: value }))
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col overflow-hidden bg-muted/40">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <FileText className="size-5 text-muted-foreground" />
        <div className="font-semibold">DTP Studio</div>
        <select
          value={pageSize}
          onChange={(event) => setPageSize(event.target.value as keyof typeof pageSizes)}
          className="ml-2 h-8 rounded-lg border border-input bg-background px-2 text-sm"
          aria-label="用紙サイズ"
        >
          <option value="A4">A4</option>
          <option value="B5">B5</option>
        </select>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => setZoom((prev) => Math.max(0.45, prev - 0.08))} aria-label="縮小">
          <ZoomOut className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => setZoom((prev) => Math.min(1, prev + 0.08))} aria-label="拡大">
          <ZoomIn className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => window.print()}>
          <Printer className="size-4" />
          印刷/PDF
        </Button>
        <Button type="button" size="sm" onClick={exportHtml}>
          <Download className="size-4" />
          HTML出力
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[20rem_1fr]">
        <aside className="min-h-0 overflow-auto border-b bg-background p-4 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Palette className="size-4 text-muted-foreground" />
            編集パネル
          </div>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="dtp-title">タイトル</Label>
              <Input id="dtp-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dtp-subtitle">サブタイトル</Label>
              <Input id="dtp-subtitle" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dtp-issue">号数・イベント名</Label>
              <Input id="dtp-issue" value={issue} onChange={(event) => setIssue(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>テーマ</Label>
              <select value={theme} onChange={(event) => setTheme(event.target.value as keyof typeof themes)} className="h-8 rounded-lg border border-input bg-background px-2 text-sm">
                {Object.entries(themes).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label>段組</Label>
                <Input type="number" min={1} max={3} value={columns} onChange={(event) => setColumns(Math.min(3, Math.max(1, Number(event.target.value))))} />
              </div>
              <div className="grid gap-1.5">
                <Label>余白</Label>
                <Input type="number" min={24} max={96} value={margin} onChange={(event) => setMargin(Math.min(96, Math.max(24, Number(event.target.value))))} />
              </div>
              <div className="grid gap-1.5">
                <Label>文字</Label>
                <Input type="number" min={0.8} max={1.3} step={0.05} value={fontScale} onChange={(event) => setFontScale(Math.min(1.3, Math.max(0.8, Number(event.target.value))))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>掲載文を編集</Label>
              <select value={selectedProject?.id ?? ""} onChange={(event) => setSelectedProjectId(event.target.value)} className="h-8 rounded-lg border border-input bg-background px-2 text-sm">
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
              {selectedProject ? (
                <textarea
                  value={copyOverrides[selectedProject.id] ?? selectedProject.note}
                  onChange={(event) => updateProjectCopy(selectedProject.id, event.target.value)}
                  className="min-h-28 rounded-lg border border-input bg-background p-2 text-sm"
                />
              ) : null}
            </div>
          </div>
        </aside>

        <div className="min-h-0 overflow-auto p-6">
          <div
            id="dtp-document"
            className="dtp-page text-black shadow-lg print:shadow-none"
            style={{
              width: size.width,
              minHeight: size.height,
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              margin: `0 auto ${Math.round(size.height * (zoom - 1) + 48)}px`,
              padding: margin,
              background: colors.paper,
              fontSize: `${fontScale}rem`,
            }}
          >
            <header className="pb-5" style={{ borderBottom: `6px solid ${colors.accent}` }}>
              <div className="text-sm font-bold tracking-[0.25em]" style={{ color: colors.accent }}>EVENT OPS PROGRAM GUIDE</div>
              <h1 className="mt-4 text-5xl font-black tracking-tight">{title}</h1>
              <p className="mt-3 max-w-2xl text-lg font-medium">{subtitle}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div>{issue}</div>
                <div>企画数: {projects.length}</div>
                <div>出力日: {new Date().toLocaleDateString("ja-JP")}</div>
              </div>
            </header>

            <section className="mt-8 grid gap-5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {projectCards.map(({ project, organization }, index) => (
                <article key={project.id} className="break-inside-avoid border p-4" style={{ background: "#fff", borderColor: colors.accent }}>
                  <div className="mb-3 flex items-center justify-between border-b pb-2 text-xs" style={{ borderColor: colors.accent }}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{project.department}</span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight">{project.title}</h2>
                  <div className="mt-2 text-sm font-semibold">{project.organizationName}</div>
                  <p className="mt-3 text-sm leading-6">{copyOverrides[project.id] ?? project.note ?? organization?.note}</p>
                  <dl className="mt-4 grid gap-2 text-xs">
                    <div className="grid grid-cols-[4rem_1fr] gap-2">
                      <dt className="font-bold">会場</dt>
                      <dd>{project.venue || organization?.booth || "未定"}</dd>
                    </div>
                    <div className="grid grid-cols-[4rem_1fr] gap-2">
                      <dt className="font-bold">時間</dt>
                      <dd>{project.startTime}-{project.endTime}</dd>
                    </div>
                    <div className="grid grid-cols-[4rem_1fr] gap-2">
                      <dt className="font-bold">状態</dt>
                      <dd>{project.status}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
