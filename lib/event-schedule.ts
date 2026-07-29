export type EventPeriod = {
  startDate: string
  endDate: string
}

export type FestivalDay = {
  date: string
  label: string
  startTime: string
  endTime: string
}

export type SiteCmsContent = {
  heroTitle: string
  heroDescription: string
  beforeFestivalLabel: string
  beforeFestivalDescription: string
  beforeOpenTitle: string
  beforeOpenDescription: string
  liveTitle: string
  liveDescription: string
  afterCloseTitle: string
  afterCloseDescription: string
  afterFestivalTitle: string
  afterFestivalDescription: string
}

export type SiteTimingPhase =
  | "before-festival"
  | "before-open"
  | "live"
  | "after-close"
  | "after-festival"

export type SiteTimingStatus = {
  phase: SiteTimingPhase
  title: string
  description: string
  countdownLabel: string | null
  countdown: string | null
  day: FestivalDay | null
}

export const eventSchedule = {
  preparationPeriod: {
    startDate: "2026-10-26",
    endDate: "2026-10-30",
  },
  festivalDays: [
    {
      date: "2026-10-31",
      label: "1日目",
      startTime: "10:00",
      endTime: "18:00",
    },
    {
      date: "2026-11-01",
      label: "2日目",
      startTime: "10:00",
      endTime: "18:00",
    },
    {
      date: "2026-11-02",
      label: "3日目",
      startTime: "10:00",
      endTime: "17:00",
    },
  ],
  cleanupPeriod: {
    startDate: "2026-11-03",
    endDate: "2026-11-04",
  },
} as const satisfies {
  preparationPeriod: EventPeriod
  festivalDays: readonly FestivalDay[]
  cleanupPeriod: EventPeriod
}

export const operationPeriod: EventPeriod = {
  startDate: eventSchedule.preparationPeriod.startDate,
  endDate: eventSchedule.cleanupPeriod.endDate,
}

export const initialSiteCmsContent: SiteCmsContent = {
  heroTitle: "ひらめきが、街と出会う3日間。",
  heroDescription: "学生の研究、表現、食のアイデアが集まる星浜大学の大学祭です。",
  beforeFestivalLabel: "本祭まであと",
  beforeFestivalDescription: "星浜祭で、みなさまをお迎えする準備を進めています。",
  beforeOpenTitle: "本日開催",
  beforeOpenDescription: "まもなく開場します。お気をつけてお越しください。",
  liveTitle: "開催中",
  liveDescription: "星浜祭を開催しています。企画を探して会場を巡ってみてください。",
  afterCloseTitle: "本日の開催は終了しました",
  afterCloseDescription: "ご来場ありがとうございました。次の開催日もお待ちしています。",
  afterFestivalTitle: "ご来場ありがとうございました",
  afterFestivalDescription: "星浜祭は全日程を終了しました。また次回お会いしましょう。",
}

const oneDayMilliseconds = 86_400_000

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  return { year, month, day }
}

function parseTimeParts(time: string) {
  const [hour, minute] = time.split(":").map(Number)
  return { hour, minute }
}

export function dateTimeForFestivalDay(day: FestivalDay, edge: "start" | "end") {
  const date = parseDateParts(day.date)
  const time = parseTimeParts(edge === "start" ? day.startTime : day.endTime)
  return new Date(date.year, date.month - 1, date.day, time.hour, time.minute)
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function toDateTimeLocalValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${toLocalDateKey(date)}T${hours}:${minutes}`
}

export function parseDateTimeLocalValue(value: string) {
  const [dateValue, timeValue = "00:00"] = value.split("T")
  const date = parseDateParts(dateValue)
  const time = parseTimeParts(timeValue)
  return new Date(date.year, date.month - 1, date.day, time.hour, time.minute)
}

export function formatJapaneseDate(dateKey: string, includeYear = true) {
  const { year, month, day } = parseDateParts(dateKey)
  const date = new Date(year, month - 1, day)
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date)
  return includeYear
    ? `${year}年${month}月${day}日（${weekday}）`
    : `${month}月${day}日（${weekday}）`
}

export function formatCompactDate(dateKey: string) {
  const { year, month, day } = parseDateParts(dateKey)
  const date = new Date(year, month - 1, day)
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date)
  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}（${weekday}）`
}

function calendarDayDifference(from: Date, dateKey: string) {
  const date = parseDateParts(dateKey)
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const targetUtc = Date.UTC(date.year, date.month - 1, date.day)
  return Math.max(0, Math.round((targetUtc - fromUtc) / oneDayMilliseconds))
}

function formatCountdown(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}日 ${hours}時間`
  if (hours > 0) return `${hours}時間 ${minutes}分`
  return `${minutes}分`
}

export function getFestivalDay(dateKey: string) {
  return eventSchedule.festivalDays.find((day) => day.date === dateKey) ?? null
}

export function getOperationDayLabel(dateKey: string) {
  const festivalDay = getFestivalDay(dateKey)
  if (festivalDay) {
    return `本祭 ${festivalDay.label}・${festivalDay.startTime}〜${festivalDay.endTime}`
  }
  if (
    dateKey >= eventSchedule.preparationPeriod.startDate &&
    dateKey <= eventSchedule.preparationPeriod.endDate
  ) {
    return "準備"
  }
  if (dateKey >= eventSchedule.cleanupPeriod.startDate && dateKey <= eventSchedule.cleanupPeriod.endDate) {
    return "片付け"
  }
  return null
}

export function getSiteTimingStatus(
  now: Date,
  content: SiteCmsContent,
  festivalDays: readonly FestivalDay[] = eventSchedule.festivalDays,
): SiteTimingStatus {
  const firstDay = festivalDays[0]
  const lastDay = festivalDays.at(-1)
  if (!firstDay || !lastDay) {
    return {
      phase: "after-festival",
      title: content.afterFestivalTitle,
      description: content.afterFestivalDescription,
      countdownLabel: null,
      countdown: null,
      day: null,
    }
  }

  const firstStart = dateTimeForFestivalDay(firstDay, "start")
  const lastEnd = dateTimeForFestivalDay(lastDay, "end")

  if (now < firstStart) {
    if (toLocalDateKey(now) === firstDay.date) {
      return {
        phase: "before-open",
        title: content.beforeOpenTitle,
        description: content.beforeOpenDescription,
        countdownLabel: "開場まで",
        countdown: formatCountdown(firstStart.getTime() - now.getTime()),
        day: firstDay,
      }
    }

    const days = calendarDayDifference(now, firstDay.date)
    return {
      phase: "before-festival",
      title: `${content.beforeFestivalLabel}${days}日`,
      description: content.beforeFestivalDescription,
      countdownLabel: null,
      countdown: null,
      day: firstDay,
    }
  }

  if (now >= lastEnd) {
    return {
      phase: "after-festival",
      title: content.afterFestivalTitle,
      description: content.afterFestivalDescription,
      countdownLabel: null,
      countdown: null,
      day: lastDay,
    }
  }

  for (const day of festivalDays) {
    const start = dateTimeForFestivalDay(day, "start")
    const end = dateTimeForFestivalDay(day, "end")

    if (now >= start && now < end) {
      return {
        phase: "live",
        title: content.liveTitle,
        description: content.liveDescription,
        countdownLabel: "本日の終了まで",
        countdown: formatCountdown(end.getTime() - now.getTime()),
        day,
      }
    }

    if (now < start) {
      const sameDay = toLocalDateKey(now) === day.date
      return {
        phase: sameDay ? "before-open" : "after-close",
        title: sameDay ? content.beforeOpenTitle : content.afterCloseTitle,
        description: sameDay ? content.beforeOpenDescription : content.afterCloseDescription,
        countdownLabel: sameDay ? "開場まで" : "次の開催まで",
        countdown: formatCountdown(start.getTime() - now.getTime()),
        day,
      }
    }
  }

  return {
    phase: "after-festival",
    title: content.afterFestivalTitle,
    description: content.afterFestivalDescription,
    countdownLabel: null,
    countdown: null,
    day: lastDay,
  }
}
