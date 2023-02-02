import { useEffect, useState } from 'react'
import useNostrStore from '~/hooks/useNostrStore'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'

export const useSubscription = (id: string, filter: Filter[]) => {
  const [notes, setNotes] = useState<Event[]>([])

  const onEventCallback = (event: Event) => {
    setNotes((prev) => {
      if (prev.some((a) => a.id === event.id)) {
        return prev
      }
      // console.log(event)

      // before settings the event into the list
      // check store for event.pubkey kind5 metadata
      return [...prev, event]
    })
  }

  useEffect(() => {
    nostrClient.subscribe(id, filter, onEventCallback)

    return () => {
      nostrClient.unsubscribe(id)
    }
  }, [id])

  return notes
}
