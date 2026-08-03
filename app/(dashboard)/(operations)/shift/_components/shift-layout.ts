import { END_MINUTES, SLOT_MINUTES, START_MINUTES, timeSlots } from "./shift-domain"

export const SLOT_WIDTH = 16
export const MOVE_LONG_PRESS_MS = 180
export const TIMELINE_PADDING_WIDTH = 2 * SLOT_WIDTH
export const TIMELINE_WIDTH = ((END_MINUTES - START_MINUTES) / SLOT_MINUTES) * SLOT_WIDTH
export const TIMELINE_TRACK_WIDTH = TIMELINE_WIDTH + TIMELINE_PADDING_WIDTH * 2

export const MOBILE_SLOT_HEIGHT = 14
export const MOBILE_TIMELINE_PADDING_HEIGHT = 2 * MOBILE_SLOT_HEIGHT
export const MOBILE_TIMELINE_HEIGHT =
  ((END_MINUTES - START_MINUTES) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
export const MOBILE_TIMELINE_TRACK_HEIGHT =
  MOBILE_TIMELINE_HEIGHT + MOBILE_TIMELINE_PADDING_HEIGHT * 2
export const MOBILE_TIMELINE_GRID_BACKGROUND =
  `repeating-linear-gradient(to bottom, transparent 0, transparent ${MOBILE_SLOT_HEIGHT - 1}px, color-mix(in oklch, var(--border), transparent 35%) ${MOBILE_SLOT_HEIGHT - 1}px, color-mix(in oklch, var(--border), transparent 35%) ${MOBILE_SLOT_HEIGHT}px)`

export function getMobileSlotOffset(minutes: number) {
  return ((minutes - START_MINUTES) / SLOT_MINUTES) * MOBILE_SLOT_HEIGHT
}

export function getMobileTimelineOffset(minutes: number) {
  return MOBILE_TIMELINE_PADDING_HEIGHT + getMobileSlotOffset(minutes)
}

export const DESKTOP_TIMELINE_HEADER_HEIGHT = 64
export const DESKTOP_MEMBER_ROW_HEIGHT = 88
export const DESKTOP_MEMBER_COLUMN_WIDTH = 15 * 16

// MVPでは新規作成ボタンを閉じ、タイムライン上のD&D作成だけを提供する。
export const SHIFT_CREATION_ENABLED = false
export const SHIFT_DND_CREATION_ENABLED = true

export function getHoveredSlotRadiusClass(slot: number) {
  if (slot === 0) return "rounded-l-lg"
  if (slot === timeSlots.length - 1) return "rounded-r-lg"
  return ""
}
