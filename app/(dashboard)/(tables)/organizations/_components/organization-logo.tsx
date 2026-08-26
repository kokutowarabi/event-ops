import Image from "next/image"
import type { EventOrganization } from "@/lib/event-data"
import { cn } from "@/lib/utils"
import { getOrganizationImageSrc } from "./organization-images"

type OrganizationLogoProps = {
  organization: Pick<EventOrganization, "id" | "name">
  className?: string
}

export function OrganizationLogo({ organization, className }: OrganizationLogoProps) {
  const src = getOrganizationImageSrc(organization.id)

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-white",
        className,
      )}
      aria-label={src ? `${organization.name}のロゴ` : `${organization.name}のロゴ未登録`}
    >
      {src ? (
        <Image
          src={src}
          alt={`${organization.name}のロゴ`}
          fill
          sizes="(max-width: 767px) 4rem, 2.5rem"
          className="object-contain p-1"
        />
      ) : (
        <span className="text-[10px] text-muted-foreground">ロゴなし</span>
      )}
    </div>
  )
}
