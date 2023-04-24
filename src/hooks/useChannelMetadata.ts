import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'

const useChannelMetadata = (pubkey: string | undefined, channelId: string | undefined | null) => {
  const [currentEvent, setCurrentEvent] = useState<Event | undefined>(undefined)

  const filters: Filter[] = [
    {
      kinds: [40],
      ids: [channelId || ''],
      // authors: []
    },
    {
      kinds: [41],
      '#e': [channelId || ''],
      // authors: []
    },
  ]

  const onEventCallback = (event: Event) => {
    setCurrentEvent((currentEvent) => {
      if (!currentEvent || event.created_at > currentEvent.created_at) {
        return event
      }

      return currentEvent
    })
  }

  useEffect(() => {
    if (channelId || pubkey) {
      nostrClient.subscribe('channelMetadata', filters, onEventCallback)

      return () => {
        setCurrentEvent(undefined)
        nostrClient.unsubscribe('channelMetadata')
      }
    } else {
      setCurrentEvent(undefined)
    }
  }, [channelId])

  // return currentEvent && { name: currentEvent.name, currentEvent.about, currentEvent.profile}
  const getChannelMetadata = (event: Event | undefined) => {
    if (event) {
      try {
        let d = JSON.parse(event.content)
        return {
          name: d.name,
          about: d.about,
          picture: d.picture,
        }
      } catch (e: any) {
        console.warn('Malformed channel event', e, event)
      }
    }

    return undefined
  }
  return getChannelMetadata(currentEvent)
}

export default useChannelMetadata
