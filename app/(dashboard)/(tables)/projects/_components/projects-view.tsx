"use client"

import dynamic from "next/dynamic"
import { ProjectsRouteLoading } from "./projects-route-loading"

export const ProjectsView = dynamic(
  () => import("./projects-data-view").then((module) => module.ProjectsDataView),
  {
    ssr: false,
    loading: ProjectsRouteLoading,
  },
)
