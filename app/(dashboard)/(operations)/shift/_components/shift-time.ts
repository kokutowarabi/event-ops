export const START_MINUTES = 6 * 60
export const END_MINUTES = 22 * 60
export const SLOT_MINUTES = 15
export const COVERAGE_SLOT_MINUTES = 30

export function addDays(key: string, amount: number) {
  const [year, month, day] = key.split("-").map(Number)
  const date = new Date(year, month - 1, day + amount)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0")
  const nextDay = String(date.getDate()).padStart(2, "0")
  return `${nextYear}-${nextMonth}-${nextDay}`
}

export function dateDiff(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split("-").map(Number)
  const [endYear, endMonth, endDay] = end.split("-").map(Number)
  const startTime = new Date(startYear, startMonth - 1, startDay).getTime()
  const endTime = new Date(endYear, endMonth - 1, endDay).getTime()
  return Math.max(0, Math.round((endTime - startTime) / 86_400_000))
}

export function formatDate(key: string) {
  const [year, month, day] = key.split("-")
  return `${year}/${month}/${day}`
}

export function formatTime(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
}

export function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

export function clampShiftEnd(end: number, start: number) {
  return Math.min(Math.max(end, start + SLOT_MINUTES), END_MINUTES)
}

export const timeOptions = Array.from(
  { length: (END_MINUTES - START_MINUTES) / SLOT_MINUTES + 1 },
  (_, index) => {
    const minutes = START_MINUTES + index * SLOT_MINUTES
    const label = formatTime(minutes)
    return { value: label, label, minutes }
  },
)

export const timeSlots = timeOptions.slice(0, -1)

export const coverageTimeSlots = Array.from(
  { length: (END_MINUTES - START_MINUTES) / COVERAGE_SLOT_MINUTES },
  (_, index) => START_MINUTES + index * COVERAGE_SLOT_MINUTES,
)

export function shouldSplitShiftTimeLabels(start: number, end: number) {
  return end - start < 75
}

export function getCreateShiftTimeRange(startSlot: number, currentSlot: number) {
  const firstSlot = Math.min(startSlot, currentSlot)
  const lastSlotExclusive = Math.max(startSlot, currentSlot) + 1
  return {
    start: START_MINUTES + firstSlot * SLOT_MINUTES,
    end: START_MINUTES + lastSlotExclusive * SLOT_MINUTES,
  }
}
