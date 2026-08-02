import { useEffect } from "react"

function isTextEditingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable
    || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  )
}

export function useShiftHistoryShortcuts(
  onUndo: () => void,
  onRedo: () => void,
) {
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        !event.metaKey
        || event.altKey
        || event.ctrlKey
        || event.key.toLowerCase() !== "z"
      ) return
      if (isTextEditingTarget(event.target)) return
      event.preventDefault()
      if (event.shiftKey) onRedo()
      else onUndo()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onRedo, onUndo])
}
