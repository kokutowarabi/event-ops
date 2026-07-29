export type CsvValue = string | number | null | undefined

function escapeCsvValue(value: CsvValue) {
  const rawValue = String(value ?? "")
  const safeValue = typeof value === "string" && /^[=+\-@\t\r]/.test(rawValue)
    ? `'${rawValue}`
    : rawValue
  return `"${safeValue.replace(/"/g, '""')}"`
}

export function serializeCsv(headers: string[], rows: CsvValue[][]) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n")
}

function localDateStamp(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function downloadCsv(
  filenamePrefix: string,
  headers: string[],
  rows: CsvValue[][],
) {
  const csv = serializeCsv(headers, rows)
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const safePrefix = filenamePrefix.replace(/[/\\?%*:|"<>]/g, "-").trim() || "データ"
  link.href = url
  link.download = `${safePrefix}_${localDateStamp(new Date())}.csv`
  link.style.display = "none"
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
