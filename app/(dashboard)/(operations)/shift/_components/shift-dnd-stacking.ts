export function getShiftBlockStackClass(active: boolean) {
  return active ? "z-50" : ""
}

export function getShiftRowStackClass(pinned: boolean, active: boolean) {
  if (pinned) {
    return `sticky ${active ? "z-40" : "z-15"} h-[88px] bg-card shadow-sm`
  }
  return active ? "relative z-40" : ""
}
