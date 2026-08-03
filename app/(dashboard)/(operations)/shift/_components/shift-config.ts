import type { CSSProperties } from "react"
import type {
  ShiftKind,
  ShiftTemplate,
  ShiftTemplateId,
} from "@/lib/shift-data"

export type ShiftTemplateColor = {
  blockStyle: CSSProperties
  dotStyle: CSSProperties
}

export const shiftKinds: Record<ShiftKind, { label: string }> = {
  morning: { label: "オレンジ" },
  day: { label: "ブルー" },
  evening: { label: "グリーン" },
  full: { label: "パープル" },
}

export const DEFAULT_SHIFT_TEMPLATE_ID = "tentative"

export const shiftTemplates: Record<ShiftTemplateId, ShiftTemplate> = {
  [DEFAULT_SHIFT_TEMPLATE_ID]: {
    label: "未指定",
    kind: "day",
    defaultMinutes: 60,
    note: "未指定",
  },
  reception: {
    label: "受付",
    kind: "morning",
    defaultMinutes: 180,
    note: "受付・来場者対応",
  },
  guide: {
    label: "会場誘導",
    kind: "day",
    defaultMinutes: 240,
    note: "導線案内・列整理",
  },
  stage: {
    label: "ステージ進行",
    kind: "full",
    defaultMinutes: 180,
    note: "登壇者誘導・転換補助",
  },
  security: {
    label: "警備・巡回",
    kind: "evening",
    defaultMinutes: 180,
    note: "会場巡回・混雑対応",
  },
  exhibitor: {
    label: "出展者対応",
    kind: "day",
    defaultMinutes: 180,
    note: "参加団体受付・控室対応",
  },
  setup: {
    label: "設営・撤収",
    kind: "evening",
    defaultMinutes: 120,
    note: "備品搬入・撤収確認",
  },
  break: {
    label: "休憩",
    kind: "day",
    defaultMinutes: 45,
    note: "休憩",
  },
}

export function createShiftTemplateColor(index: number): ShiftTemplateColor {
  const hue = Math.round((210 + index * 137.508) % 360)
  return {
    blockStyle: {
      borderColor: `hsl(${hue} 72% 42% / 0.45)`,
      backgroundColor: `hsl(${hue} 86% 90% / 0.94)`,
      color: `hsl(${hue} 68% 22%)`,
    },
    dotStyle: {
      backgroundColor: `hsl(${hue} 72% 48%)`,
    },
  }
}
