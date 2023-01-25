import { useEffect, useState } from 'react'
import useNostrStore from '~/store/useNostrStore'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'

export const useSubscription = (id: string, filter: Filter[]) => {
  const [notes, setNotes] = useState<Event[]>([])

  const onEventCallback = (event: Event) => {
    setNotes((prev) => {
      if (prev.some((a) => a.id === event.id)) {
        return prev
      }
      console.log(event)
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

// export const useSubscription = (filter: Filter[]) => {
//   const [notes, setNotes] = useState<Event[]>([])
//   const { connectedRelays, addSubscription, removeSubscription } = useNostrStore()

//   const onEventCallback = (event: Event) => {
//     console.log(event)
//     setNotes((prev) => {
//       if (prev.some(a => a.id === event.id)) {
//         return prev
//       }
//       return [...prev, event]
//     })
//   }

//   useEffect(() => {
//     addSubscription(filter, onEventCallback, "channel")

//     return (() => {
//       removeSubscription("channel")
//     })
//   // }, [connectedRelays])
//   }, [])

//   return notes
// }
