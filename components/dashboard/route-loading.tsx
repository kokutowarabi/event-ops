import {
  ArrowUpDown,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Download,
  Filter,
  Layers3,
  MonitorSmartphone,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { formatCompactDate, operationPeriod } from "@/lib/event-schedule"
import { siteConfig } from "@/lib/site-config"
import { VoteDataSkeleton } from "@/components/dashboard/vote-data-skeleton"

const loadingRows = Array.from({ length: 8 }, (_, index) => index)

function Skeleton({
  className = "",
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-muted ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

function LoadingActions({ includeAdd = true }: { includeAdd?: boolean }) {
  return (
    <div
      className={includeAdd ? "ml-2 flex items-center gap-4" : "flex items-center gap-2"}
      aria-hidden="true"
    >
      {includeAdd ? (
        <span className="grid size-8 place-items-center rounded-md bg-primary/15 text-muted-foreground">
          <Plus className="size-4" />
        </span>
      ) : null}
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm text-muted-foreground">
        <Download className="size-4" />
        CSV
      </span>
    </div>
  )
}

function TableRouteLoading({
  icon: Icon,
  title,
  columns,
  maxWidthClass,
}: {
  icon: LucideIcon
  title: string
  columns: string[]
  maxWidthClass: string
}) {
  return (
    <div className={`mx-auto flex h-[calc(100svh-5.5rem)] ${maxWidthClass} flex-col px-4 py-5 md:py-6`}>
      <header className="mb-4 flex shrink-0 items-center gap-2">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        <LoadingActions />
      </header>

      <div
        className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card"
        role="status"
        aria-label={`${title}のデータを読み込み中`}
      >
        <div
          className="grid h-11 min-w-max items-center border-b bg-muted/40"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))`,
          }}
        >
          {columns.map((column) => (
            <div
              key={column}
              className="flex h-full items-center gap-2 border-r px-4 text-sm font-medium last:border-r-0"
            >
              <span>{column}</span>
              <Filter className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="min-w-max">
          {loadingRows.map((row) => (
            <div
              key={row}
              className="grid h-12 border-b last:border-b-0"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))`,
              }}
            >
              {columns.map((column, columnIndex) => (
                <div
                  key={`${row}-${column}`}
                  className="flex items-center border-r px-4 last:border-r-0"
                >
                  <Skeleton
                    className="h-4"
                    style={{ width: `${55 + ((row + columnIndex) * 13) % 35}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <span className="sr-only">読み込み中</span>
      </div>
    </div>
  )
}

export function RosterRouteLoading() {
  return (
    <TableRouteLoading
      icon={Users}
      title="名簿"
      columns={["氏名", "メールアドレス", "所属局", "役職"]}
      maxWidthClass="max-w-6xl"
    />
  )
}

export function OrganizationsRouteLoading() {
  return (
    <TableRouteLoading
      icon={Building2}
      title="参加団体管理"
      columns={["参加団体名", "種別", "部門", "代表者", "配置", "状態", "メモ"]}
      maxWidthClass="max-w-7xl"
    />
  )
}

export function ProjectsRouteLoading() {
  return (
    <TableRouteLoading
      icon={ClipboardList}
      title="企画管理"
      columns={["企画名", "参加団体", "部門", "会場", "時間", "状態"]}
      maxWidthClass="max-w-7xl"
    />
  )
}

export function ShiftRouteLoading() {
  return (
    <div className="mx-auto flex h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-4 py-5 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          シフト管理
        </h1>
        <div className="flex rounded-md border bg-muted/35 p-0.5 text-sm" aria-hidden="true">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-secondary px-2.5">
            <Users className="size-3.5" />
            個人別
          </span>
          <span className="inline-flex h-7 items-center gap-1.5 px-2.5 text-muted-foreground">
            <Layers3 className="size-3.5" />
            担当業務別
          </span>
        </div>
        <span
          className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-semibold"
          aria-hidden="true"
        >
          <CalendarDays className="size-3.5 text-muted-foreground" />
          {formatCompactDate(operationPeriod.startDate)}
        </span>
        <LoadingActions includeAdd={false} />
      </header>

      <div
        className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card"
        role="status"
        aria-label="シフトデータを読み込み中"
      >
        <div className="flex h-12 items-center gap-3 border-b bg-muted/40 px-4">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="ml-auto h-7 w-24" />
        </div>
        <div className="flex h-9 items-center border-b px-4 text-xs text-muted-foreground">
          <span className="w-52 shrink-0">メンバー</span>
          <span className="flex flex-1 justify-between">
            <span>6:00</span>
            <span>10:00</span>
            <span>14:00</span>
            <span>18:00</span>
            <span>22:00</span>
          </span>
        </div>
        {loadingRows.map((row) => (
          <div key={row} className="flex h-14 items-center border-b px-4 last:border-b-0">
            <div className="w-52 shrink-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1.5 h-3 w-20 bg-muted/70" />
            </div>
            <div className="relative h-8 flex-1 overflow-hidden rounded bg-muted/25">
              <Skeleton
                className="absolute h-6 rounded"
                style={{
                  left: `${8 + (row % 4) * 7}%`,
                  top: "4px",
                  width: `${24 + (row % 3) * 8}%`,
                }}
              />
            </div>
          </div>
        ))}
        <span className="sr-only">読み込み中</span>
      </div>
    </div>
  )
}

export function VoteRouteLoading() {
  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-7xl flex-col px-3 py-4 md:px-4 md:py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <BarChart3 className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          投票結果
        </h1>
        <LoadingActions includeAdd={false} />
      </header>
      <VoteDataSkeleton />
    </div>
  )
}

export function PreviewRouteLoading() {
  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-7xl flex-col gap-3 overflow-hidden p-3 md:p-4">
      <header className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <MonitorSmartphone className="size-5 text-muted-foreground" aria-hidden="true" />
        <div className="mr-auto">
          <h1 className="font-semibold">サイトプレビュー</h1>
          <p className="text-xs text-muted-foreground">
            企画管理の変更内容と投票導線を、そのままサイト表示で確認できます。
          </p>
        </div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-20" />
      </header>

      <div
        className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-[#f7f4ed] shadow-sm"
        role="status"
        aria-label="サイトプレビューを読み込み中"
      >
        <div className="flex h-16 items-center border-b border-slate-900/10 bg-[#fffdf8] px-4 md:px-8">
          <div className="mr-auto">
            <div className="text-[10px] font-black tracking-[0.2em] text-cyan-700">
              {siteConfig.universityNameEn}
            </div>
            <div className="font-black text-slate-900">{siteConfig.festivalEdition}</div>
          </div>
          <span className="mr-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">トップ</span>
          <span className="px-3 py-1.5 text-sm text-slate-600">企画</span>
        </div>
        <div className="grid h-full place-items-center px-5 py-12 text-center">
          <div className="w-full max-w-2xl">
            <p className="text-sm font-bold tracking-[0.28em] text-cyan-800">
              {siteConfig.universityName}
            </p>
            <h2 className="mt-3 text-5xl font-black text-slate-950 md:text-7xl">
              {siteConfig.festivalName}
            </h2>
            <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-white bg-white/80 p-6">
              <Skeleton className="mx-auto h-4 w-36 bg-slate-200" />
              <Skeleton className="mx-auto mt-4 h-7 w-56 bg-slate-200" />
              <Skeleton className="mx-auto mt-3 h-4 w-4/5 bg-slate-100" />
            </div>
          </div>
        </div>
        <span className="sr-only">読み込み中</span>
      </div>
    </div>
  )
}
