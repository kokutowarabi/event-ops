import { eventSchedule, getFestivalDay } from "@/lib/event-schedule"

export type SitePreviewStatus = {
  phase: "before" | "before-open" | "open" | "closed-today" | "after"
  headline: string
  detail: string
  votingOpen: boolean
  voteDate: string | null
}

function dateDiff(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split("-").map(Number)
  const [endYear, endMonth, endDay] = end.split("-").map(Number)
  const startTime = Date.UTC(startYear, startMonth - 1, startDay)
  const endTime = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.round((endTime - startTime) / 86_400_000)
}

export function getSitePreviewStatus(dateTime: string): SitePreviewStatus {
  const [date = "", time = ""] = dateTime.split("T")
  const firstDay = eventSchedule.festivalDays[0]
  const lastDay = eventSchedule.festivalDays[eventSchedule.festivalDays.length - 1]
  const festivalDay = getFestivalDay(date)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return {
      phase: "before",
      headline: "プレビュー日時を選択してください",
      detail: "日時に応じたサイト表示を確認できます",
      votingOpen: false,
      voteDate: null,
    }
  }

  if (date < firstDay.date) {
    const days = Math.max(1, dateDiff(date, firstDay.date))
    return {
      phase: "before",
      headline: `本祭まであと${days}日`,
      detail: `${firstDay.date}から${eventSchedule.festivalDays.length}日間開催します`,
      votingOpen: false,
      voteDate: null,
    }
  }

  if (date > lastDay.date || (date === lastDay.date && time > lastDay.endTime)) {
    return {
      phase: "after",
      headline: "ご来場ありがとうございました",
      detail: "投票受付は終了しました",
      votingOpen: false,
      voteDate: null,
    }
  }

  if (!festivalDay) {
    return {
      phase: "closed-today",
      headline: "本日の開催はありません",
      detail: "開催日程をご確認ください",
      votingOpen: false,
      voteDate: null,
    }
  }

  if (time < festivalDay.startTime) {
    return {
      phase: "before-open",
      headline: `${festivalDay.label} 開場前`,
      detail: `${festivalDay.startTime}から開催します`,
      votingOpen: false,
      voteDate: festivalDay.date,
    }
  }

  if (time <= festivalDay.endTime) {
    return {
      phase: "open",
      headline: `${festivalDay.label} 開催中`,
      detail: `${festivalDay.endTime}まで・企画投票を受付中`,
      votingOpen: true,
      voteDate: festivalDay.date,
    }
  }

  return {
    phase: "closed-today",
    headline: `${festivalDay.label}は終了しました`,
    detail: "本日の投票受付は終了しました",
    votingOpen: false,
    voteDate: festivalDay.date,
  }
}
