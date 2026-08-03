"use client"

import dynamic from "next/dynamic"
import { RosterRouteLoading } from "./roster-route-loading"

export const RosterView = dynamic(
  () => import("./roster-data-view").then((module) => module.RosterDataView),
  {
    ssr: false,
    loading: RosterRouteLoading,
  },
)
