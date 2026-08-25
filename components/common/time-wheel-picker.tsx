"use client"

import { Clock3 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const ITEM_HEIGHT = 36
const WHEEL_PADDING = ITEM_HEIGHT * 2
const MINUTES_PER_DAY = 24 * 60 - 1

type TimeWheelPickerProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  minMinutes?: number
  maxMinutes?: number
  minuteStep?: number
  className?: string
}

type TimeWheelColumnsProps = Omit<TimeWheelPickerProps, "label" | "className">

type WheelColumnProps = {
  label: string
  values: string[]
  value: string
  onChange: (value: string) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function parseTime(value: string) {
  const [hour = "00", minute = "00"] = value.split(":")
  const parsedHour = Number(hour)
  const parsedMinute = Number(minute)
  return {
    hour: Number.isFinite(parsedHour) ? clamp(parsedHour, 0, 23) : 0,
    minute: Number.isFinite(parsedMinute) ? clamp(parsedMinute, 0, 59) : 0,
  }
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function getAllowedMinutes(minMinutes: number, maxMinutes: number, minuteStep: number) {
  const step = Math.max(1, Math.floor(minuteStep))
  const start = Math.ceil(minMinutes / step) * step
  const end = Math.floor(maxMinutes / step) * step
  const values = Array.from(
    { length: Math.max(0, Math.floor((end - start) / step) + 1) },
    (_, index) => start + index * step,
  )
  return values.length > 0 ? values : [clamp(minMinutes, 0, MINUTES_PER_DAY)]
}

function normalizeTime(
  value: string,
  allowedMinutes: number[],
) {
  const { hour, minute } = parseTime(value)
  const target = hour * 60 + minute
  const closest = allowedMinutes.reduce((best, candidate) =>
    Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best,
  )
  return {
    hour: Math.floor(closest / 60),
    minute: closest % 60,
    value: formatTime(Math.floor(closest / 60), closest % 60),
  }
}

function WheelColumn({ label, values, value, onChange }: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, values.indexOf(value)))

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "auto") => {
    const element = scrollRef.current
    if (!element) return
    if (typeof element.scrollTo === "function") {
      element.scrollTo({ top: index * ITEM_HEIGHT, behavior })
    } else {
      element.scrollTop = index * ITEM_HEIGHT
    }
  }

  useEffect(() => {
    const nextIndex = Math.max(0, values.indexOf(value))
    if (Math.abs((scrollRef.current?.scrollTop ?? 0) - nextIndex * ITEM_HEIGHT) > 2) {
      scrollToIndex(nextIndex)
    }
  }, [value, values])

  const selectIndex = (index: number) => {
    const nextIndex = clamp(index, 0, values.length - 1)
    setActiveIndex(nextIndex)
    scrollToIndex(nextIndex, "smooth")
    onChange(values[nextIndex])
  }

  const handleScroll = () => {
    const nextIndex = clamp(
      Math.round((scrollRef.current?.scrollTop ?? 0) / ITEM_HEIGHT),
      0,
      values.length - 1,
    )
    if (nextIndex === activeIndex) return
    setActiveIndex(nextIndex)
    onChange(values[nextIndex])
  }

  return (
    <div className="min-w-16">
      <span className="sr-only">{label}</span>
      <div
        ref={scrollRef}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`${label}-${values[activeIndex]}`}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault()
            selectIndex(activeIndex - 1)
          }
          if (event.key === "ArrowDown") {
            event.preventDefault()
            selectIndex(activeIndex + 1)
          }
        }}
        className="relative h-[180px] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl border bg-white [perspective:180px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: WHEEL_PADDING }}
      >
        {values.map((item, index) => {
          const distance = index - activeIndex
          const absoluteDistance = Math.abs(distance)
          return (
            <button
              key={item}
              id={`${label}-${item}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => selectIndex(index)}
              className={cn(
                "flex h-9 w-full snap-center items-center justify-center text-sm font-medium transition-[transform,opacity,color] duration-150",
                index === activeIndex ? "text-foreground" : "text-muted-foreground",
              )}
              style={{
                opacity: Math.max(0.3, 1 - absoluteDistance * 0.2),
                transform: `rotateX(${clamp(distance * -18, -54, 54)}deg) scale(${Math.max(0.82, 1 - absoluteDistance * 0.06)})`,
              }}
            >
              {item}
            </button>
          )
        })}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-xl bg-gradient-to-b from-white via-white/80 to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 rounded-b-xl bg-gradient-to-t from-white via-white/80 to-transparent" />
        <span className="pointer-events-none absolute inset-x-1 top-1/2 h-9 -translate-y-1/2 rounded-lg border-y border-primary/20 bg-primary/5" />
      </div>
    </div>
  )
}

export function TimeWheelColumns({
  value,
  onChange,
  minMinutes = 0,
  maxMinutes = MINUTES_PER_DAY,
  minuteStep = 1,
}: TimeWheelColumnsProps) {
  const allowedMinutes = useMemo(
    () => getAllowedMinutes(minMinutes, maxMinutes, minuteStep),
    [maxMinutes, minMinutes, minuteStep],
  )
  const normalized = normalizeTime(value, allowedMinutes)
  const hourValues = useMemo(
    () => Array.from(new Set(allowedMinutes.map((minutes) => String(Math.floor(minutes / 60)).padStart(2, "0")))),
    [allowedMinutes],
  )
  const minuteValues = useMemo(
    () => Array.from(new Set(allowedMinutes.map((minutes) => String(minutes % 60).padStart(2, "0")))),
    [allowedMinutes],
  )

  const updateHour = (hourValue: string) => {
    onChange(normalizeTime(`${hourValue}:${normalized.minute.toString().padStart(2, "0")}`, allowedMinutes).value)
  }

  const updateMinute = (minuteValue: string) => {
    onChange(normalizeTime(`${normalized.hour.toString().padStart(2, "0")}:${minuteValue}`, allowedMinutes).value)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <WheelColumn label="時" values={hourValues} value={String(normalized.hour).padStart(2, "0")} onChange={updateHour} />
      <span className="text-lg font-semibold text-muted-foreground" aria-hidden="true">:</span>
      <WheelColumn label="分" values={minuteValues} value={String(normalized.minute).padStart(2, "0")} onChange={updateMinute} />
    </div>
  )
}

export function TimeWheelPicker({
  value,
  onChange,
  label = "時刻",
  minMinutes,
  maxMinutes,
  minuteStep,
  className,
}: TimeWheelPickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start bg-background", className)}
            aria-label={`${label}を変更`}
          />
        }
      >
        <Clock3 className="size-4 text-muted-foreground" data-icon-motion="bounce" />
        {value}
      </PopoverTrigger>
      <PopoverContent role="dialog" aria-label={`${label}を選択`} className="w-56 p-3">
        <p className="mb-2 text-center text-xs font-medium text-muted-foreground">{label}</p>
        <TimeWheelColumns
          value={value}
          onChange={onChange}
          minMinutes={minMinutes}
          maxMinutes={maxMinutes}
          minuteStep={minuteStep}
        />
      </PopoverContent>
    </Popover>
  )
}
