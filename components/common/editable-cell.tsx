import { type KeyboardEvent, type ReactNode, useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EditableTextCellProps = {
  value: string
  placeholder?: string
  className?: string
  children?: ReactNode
  onCommit: (value: string) => void
}

export function EditableTextCell({ value, placeholder, className, children, onCommit }: EditableTextCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    const nextValue = draft.trim()
    if (nextValue !== value) onCommit(nextValue)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") commit()
    if (event.key === "Escape") cancel()
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 bg-background"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className={`block w-full cursor-text text-left ${className ?? ""}`}
    >
      {children ?? (value || <span className="text-muted-foreground">—</span>)}
    </button>
  )
}

type EditableSelectCellProps<T extends string> = {
  value: T
  options: T[]
  children?: ReactNode
  onCommit: (value: T) => void
}

export function EditableSelectCell<T extends string>({ value, options, children, onCommit }: EditableSelectCellProps<T>) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onCommit(nextValue as T)
          setEditing(false)
        }}
      >
        <SelectTrigger autoFocus className="h-8 w-full bg-background" onBlur={() => window.setTimeout(() => setEditing(false), 120)}>
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="block w-full cursor-text text-left">
      {children ?? value}
    </button>
  )
}

type EditableMultiSelectCellProps = {
  values: string[]
  options: string[]
  children?: ReactNode
  optionClassName?: (option: string) => string
  onCommit: (values: string[]) => void
}

export function EditableMultiSelectCell({
  values,
  options,
  children,
  optionClassName,
  onCommit,
}: EditableMultiSelectCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(values)
  const availableOptions = Array.from(new Set([...options, ...values])).filter(Boolean)

  const toggleOption = (option: string) => {
    setDraft((current) =>
      current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option],
    )
  }

  const commit = () => {
    if (draft.join("\u0000") !== values.join("\u0000")) onCommit(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(values)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex min-w-72 flex-wrap items-center gap-1.5">
        {availableOptions.map((option) => {
          const selected = draft.includes(option)
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleOption(option)}
              className={cn(
                "h-7 cursor-pointer rounded-lg border px-2 text-xs transition-colors",
                selected
                  ? optionClassName?.(option) ?? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option}
            </button>
          )
        })}
        <Button type="button" variant="ghost" size="icon-sm" onClick={commit} aria-label="役職を保存">
          <Check className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={cancel} aria-label="編集をキャンセル">
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(values)
        setEditing(true)
      }}
      className="block w-full cursor-text text-left"
    >
      {children ?? values.join("・")}
    </button>
  )
}
