import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'

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

export const useProfile = (id: string, filter: Filter[]) => {
  // const [notes, setNotes] = useState<Event[]>([])
  const [profile, setProfile] = useState<Metadata | undefined>(undefined)

  const onEventCallback = (event: Event) => {
    if (profile) return
    const user: Metadata = JSON.parse(event.content)
    console.log('user: ', user)
    setProfile(user)
  }

  useEffect(() => {
    // want to close subscription when we receive first data (unsub on eose?)
    nostrClient.subscribe(id, filter, onEventCallback)

    return () => {
      nostrClient.unsubscribe(id)
    }
  }, [id])

  return profile
}