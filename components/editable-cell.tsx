"use client"

import { type KeyboardEvent, type ReactNode, useState } from "react"
import { Input } from "@/components/ui/input"
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
