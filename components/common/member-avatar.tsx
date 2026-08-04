"use client"

import Image from "next/image"
import { useState } from "react"
import type { Member } from "@/lib/members"

type MemberAvatarProps = {
  member: Pick<Member, "name" | "email">
  size?: number
  className?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`
  }

  return name.slice(0, 2)
}

function getMemberImageSrc(email: string) {
  const fileName = email.split("@")[0]?.trim().toLowerCase()

  return fileName ? `/members/${fileName}.webp` : null
}

export function MemberAvatar({
  member,
  size = 36,
  className = "",
}: MemberAvatarProps) {
  const src = getMemberImageSrc(member.email)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const shouldShowImage = src !== null && failedSrc !== src

  return (
    <div
      className={[
        "relative grid shrink-0 place-items-center overflow-hidden",
        "rounded-full bg-muted text-xs font-semibold text-foreground",
        className,
      ].join(" ")}
      style={{
        width: size,
        height: size,
      }}
    >
      {shouldShowImage ? (
        <Image
          src={src}
          alt={`${member.name}の顔写真`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span aria-hidden="true">{getInitials(member.name)}</span>
      )}
    </div>
  )
}