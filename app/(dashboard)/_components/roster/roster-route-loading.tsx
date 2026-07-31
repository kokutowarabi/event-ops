import { Users } from "lucide-react"
import { TableRouteLoading } from "../loading-primitives"

export function RosterRouteLoading() {
  return (
    <TableRouteLoading
      icon={Users}
      title="名簿"
      columns={["氏名", "メールアドレス", "所属局", "役職"]}
      maxWidthClass="max-w-6xl"
    />
  )
}
