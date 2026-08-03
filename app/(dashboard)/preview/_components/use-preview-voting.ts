import { useState } from "react"
import type { EventProject } from "@/lib/event-data"
import { formatJapaneseDate } from "@/lib/event-schedule"

const votingDeviceStorageKey = "hoshihama-voting-device-id"

function voteKey(projectId: string, votedOn: string) {
  return `${votedOn}:${projectId}`
}

function getVotingDeviceId() {
  const existing = window.localStorage.getItem(votingDeviceStorageKey)
  if (existing) return existing
  const created = crypto.randomUUID()
  window.localStorage.setItem(votingDeviceStorageKey, created)
  return created
}

type PreviewVotingOptions = {
  votingOpen: boolean
  voteDate: string | null
  votingConfigured: boolean
  onVote: (
    deviceId: string,
    projectId: string,
    votedOn: string,
  ) => Promise<boolean>
}

export function usePreviewVoting({
  votingOpen,
  voteDate,
  votingConfigured,
  onVote,
}: PreviewVotingOptions) {
  const [submittingProjectId, setSubmittingProjectId] = useState("")
  const [votedProjectKeys, setVotedProjectKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [message, setMessage] = useState("")

  const vote = async (project: EventProject) => {
    if (!votingOpen || !voteDate || !votingConfigured) return
    setSubmittingProjectId(project.id)
    setMessage("")
    try {
      const accepted = await onVote(getVotingDeviceId(), project.id, voteDate)
      setVotedProjectKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys)
        nextKeys.add(voteKey(project.id, voteDate))
        return nextKeys
      })
      setMessage(
        accepted
          ? `「${project.title}」へ${formatJapaneseDate(voteDate, false)}の票として投票しました`
          : `「${project.title}」は${formatJapaneseDate(voteDate, false)}に投票済みです`,
      )
    } catch {
      setMessage("投票を送信できませんでした。Supabaseの設定を確認してください。")
    } finally {
      setSubmittingProjectId("")
    }
  }

  const isVoted = (projectId: string) =>
    voteDate ? votedProjectKeys.has(voteKey(projectId, voteDate)) : false

  return { submittingProjectId, message, vote, isVoted }
}
