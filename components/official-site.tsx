"use client"

import { ArrowUpRight, CalendarDays, MapPin, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EventProject } from "@/lib/event-data"

type OfficialSiteProps = {
  projects: EventProject[]
}

const menuGroups = [
  { title: "明大祭概要", links: ["明大祭とは", "実行委員会とは", "昨年の様子", "委員長挨拶"] },
  { title: "ご来場案内", links: ["チケット", "ご来場のみなさまへ", "よくある質問", "キャンパスマップ", "タイムテーブル"] },
  { title: "参加団体・参加者のみなさまへ", links: ["屋外ステージで企画を行う方へ", "教室で企画を行う方へ", "模擬店で企画を行う方へ"] },
  { title: "特集", links: ["テーマ", "テーマソング", "参加団体特集", "アンケート"] },
]

export function OfficialSite({ projects }: OfficialSiteProps) {
  return (
    <div className="h-[calc(100svh-4rem)] overflow-auto bg-[#f8f5ef] text-[#24211d]">
      <header className="sticky top-0 z-20 border-b bg-[#f8f5ef]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="text-lg font-black tracking-[0.18em]">MEIDAI EVENT</div>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            <a href="#about">概要</a>
            <a href="#guide">来場案内</a>
            <a href="#programs">企画</a>
            <a href="#participants">参加団体</a>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[72svh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#facc15_0_10%,transparent_11%),radial-gradient(circle_at_80%_15%,#38bdf8_0_12%,transparent_13%),linear-gradient(135deg,#fff7ed,#eff6ff_48%,#fef2f2)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-end md:justify-between md:py-24">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-black text-white">第140回 架空明大祭</Badge>
            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">この街に、祭の熱を。</h1>
            <p className="mt-5 max-w-xl text-base leading-7 md:text-lg">
              和泉キャンパスを舞台に、模擬店、屋外ステージ、教室企画が集まるイベント公式サイトです。
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button className="bg-black text-white hover:bg-black/80">
                <Search className="size-4" />
                企画を探す
              </Button>
              <Button variant="outline">
                <MapPin className="size-4" />
                アクセス
              </Button>
            </div>
          </div>
          <div className="grid w-full max-w-sm gap-3 rounded-lg border bg-white/85 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4" />
              開催情報
            </div>
            <div className="text-3xl font-bold">11.2 - 11.4</div>
            <div className="text-sm text-muted-foreground">和泉キャンパス / 10:00-18:00</div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
        <section id="programs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">企画を探す</h2>
            <ArrowUpRight className="size-5" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {["屋外ステージ", "教室", "模擬店"].map((department) => (
              <div key={department} className="rounded-lg border bg-white p-4">
                <div className="text-lg font-semibold">{department}企画</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {projects.filter((project) => project.department === department).length}件掲載中
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {menuGroups.map((group) => (
            <div key={group.title} className="rounded-lg border bg-white p-5">
              <h2 className="text-xl font-bold">{group.title}</h2>
              <div className="mt-4 grid gap-2">
                {group.links.map((link) => (
                  <a key={link} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted" href="#">
                    {link}
                    <ArrowUpRight className="size-3.5" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
