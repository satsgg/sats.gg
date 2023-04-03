import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from './useSettingsStore'

// caching?
// shallow? see zustand docs
const useFollows = (pubkey: string | undefined) => {
  const [follows, setFollows, unsetFollows] = useSettingsStore((state) => [
    state.follows,
    state.setFollows,
    state.unsetFollows,
  ])
  const [, setCurrentEvent] = useState<Event | undefined>(undefined)

  const filters: Filter[] = [
    {
      kinds: [3],
      authors: [pubkey || ''],
    },
  ]

  const onEventCallback = (event: Event) => {
    setCurrentEvent((currentEvent) => {
      if (!currentEvent || event.created_at > currentEvent.created_at) {
        setFollows(event)
        return event
      }

      return currentEvent
    })
  }

  useEffect(() => {
    if (pubkey) {
      nostrClient.subscribe('follows', filters, onEventCallback)

      return () => {
        nostrClient.unsubscribe('follows')
      }
    } else {
      unsetFollows()
      setCurrentEvent(undefined)
    }
  }, [pubkey])

  return follows
}

export default useFollows
