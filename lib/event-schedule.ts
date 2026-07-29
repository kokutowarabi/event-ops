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

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  return { year, month, day }
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

export function getOperationPeriodLabel(dateKey: string) {
  if (
    dateKey >= eventSchedule.preparationPeriod.startDate &&
    dateKey <= eventSchedule.preparationPeriod.endDate
  ) {
    return "準備日"
  }
  if (getFestivalDay(dateKey)) {
    return "本祭期間"
  }
  if (dateKey >= eventSchedule.cleanupPeriod.startDate && dateKey <= eventSchedule.cleanupPeriod.endDate) {
    return "片付け日"
  }
  return null
}
