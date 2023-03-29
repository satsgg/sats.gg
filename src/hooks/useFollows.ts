import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from './useSettingsStore'

// caching?
// shallow? see zustand docs
const useFollows = (pubkey: string | undefined) => {
  const [follows, setFollows] = useSettingsStore((state) => [state.follows, state.setFollows])
  const [currentNote, setCurrentNote] = useState<Event | undefined>(undefined)

  const filters: Filter[] = [
    {
      kinds: [3],
      authors: [pubkey || ''],
    },
  ]

  const onEventCallback = (event: Event) => {
    setCurrentNote((cn) => {
      if (!cn) return event
      if (event.created_at <= cn.created_at) return cn
      setFollows(event)
      return event
    })
  }

  useEffect(() => {
    if (pubkey) {
      nostrClient.subscribe('follows', filters, onEventCallback)

      return () => {
        nostrClient.unsubscribe('follows')
      }
    }
  }, [pubkey])

  return follows
}

export default useFollows
