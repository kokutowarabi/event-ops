"use client"

import { useEventOps } from "../../../_components/event-ops-provider"
import { OrganizationManager } from "./organization-manager"

export function OrganizationsView() {
  const {
    organizations,
    setOrganizations,
    deleteOrganization,
  } = useEventOps()

  return (
    <OrganizationManager
      organizations={organizations}
      onOrganizationsChange={setOrganizations}
      onDeleteOrganization={deleteOrganization}
    />
  )
}
