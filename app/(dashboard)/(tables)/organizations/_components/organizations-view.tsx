"use client"

import dynamic from "next/dynamic"
import { OrganizationsRouteLoading } from "./organizations-route-loading"

export const OrganizationsView = dynamic(
  () => import("./organizations-data-view").then((module) => module.OrganizationsDataView),
  {
    ssr: false,
    loading: OrganizationsRouteLoading,
  },
)
