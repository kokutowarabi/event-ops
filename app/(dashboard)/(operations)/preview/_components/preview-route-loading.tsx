import { Skeleton } from "../../../_components/loading-primitives"
import { siteConfig } from "@/lib/site-config"

export function PreviewRouteLoading() {
  return (
    <div
      className="relative h-svh overflow-hidden bg-[#f7f4ed]"
      role="status"
      aria-label="サイトプレビューを読み込み中"
    >
      <div className="h-full overflow-hidden">
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
      <div className="fixed right-0 top-1/2 h-20 w-4 -translate-y-1/2 rounded-l-2xl border bg-popover shadow-lg" />
    </div>
  )
}
