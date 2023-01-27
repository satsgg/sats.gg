import { useEffect, useState } from 'react'
import { useSubscription } from '~/hooks/useSubscription'
import { useProfile } from '~/hooks/useProfile'
import { Filter, Event as NostrEvent } from 'nostr-tools'
// import { useNostrEvents } from './Chat'

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
  const filters: Filter[] = [
    {
      kinds: [0],
      authors: [pubkey]
    },
  ]

  const profile = useProfile(pubkey, filters)

  if (profile && profile.name) {
    return <span className="text-sm text-orange-300">{profile.name}</span>
  }

  return <span className="text-sm">{pubkey.slice(0, 12)}</span>
}
