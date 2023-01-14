import { useEffect, useState } from "react"
import { useNostrEvents } from "./Chat"

interface Metadata {
  name?: string
  display_name?: string
  picture?: string
  about?: string
  website?: string
  lud06?: string
  lud16?: string
  nip06?: string
}

export const ChatUser = ({ pubkey }: { pubkey: string }) => {
  const [profile, setProfile] = useState<Metadata>({})
  const { onEvent } = useNostrEvents({
    filter: {
      kinds: [0],
      authors: [pubkey]
    }
  })

  onEvent((rawMetadata) => {
    const metadata: Metadata = JSON.parse(rawMetadata.content)
    console.log('metadata: ', metadata)
    setProfile(metadata)
  })

  if (profile.name) {
    return <span className="text-sm">{profile.name}</span>
  }

  return (
    <span className="text-sm">{pubkey.slice(0,12)}</span>
  )
}