import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import { uniqBy } from '~/utils/nostr'

export const useSubscription = (id: string, filter: Filter[], reverse = false, limit: number = 500) => {
  const [notes, setNotes] = useState<Event[]>([])

  const onEventCallback = (event: Event) => {
    setNotes((prev) => {
      if (prev.some((a) => a.id === event.id)) {
        return prev
      }
      // before settings the event into the list
      // check store for event.pubkey kind5 metadata
      if (prev.length > limit) return [...prev.slice(1), event]
      return [...prev, event]
    })
  }

  useEffect(() => {
    if (id && filter.length > 0) {
      nostrClient.subscribe(id, filter, onEventCallback)

      return () => {
        setNotes([])
        nostrClient.unsubscribe(id)
      }
    }
  }, [id, JSON.stringify(filter)])

  const uniqEvents = notes.length > 0 ? uniqBy(notes, 'id') : []
  if (reverse) return uniqEvents.sort((b, a) => a.created_at - b.created_at)
  return uniqEvents.sort((b, a) => b.created_at - a.created_at)
}
