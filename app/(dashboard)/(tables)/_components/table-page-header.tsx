import type { ReactNode } from "react"
import { TableHeader, TableRow } from "@/components/ui/table"

export function TablePageHeader({ children }: { children: ReactNode }) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-muted/80">
      <TableRow className="bg-muted/80 hover:bg-muted/80 [&>th]:border-b-2 [&>th]:border-border [&>th]:font-semibold">
        {children}
      </TableRow>
    </TableHeader>
  )
}
