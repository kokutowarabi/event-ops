"use client"

import { OrganizationManager } from "@/components/organization-manager"
import { useEventOps } from "@/components/dashboard/event-ops-provider"

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
