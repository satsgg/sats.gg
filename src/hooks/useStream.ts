import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import { Stream, parseStreamNote, uniqBy } from '~/utils/nostr'

export const useStream = (pubkey: string) => {
  const [stream, setStream] = useState<Stream | null>(null)

  const filter: Filter[] = [
    {
      kinds: [30311],
      authors: [pubkey],
    },
  ]

  const onEventCallback = (event: Event) => {
    setStream((prev) => {
      if (!prev) {
        console.log('event', event)
        return parseStreamNote(event)
      }
      const alreadyHaveNote = prev.id === event.id
      const newerNoteExists = prev.created_at >= event.created_at
      if (alreadyHaveNote || newerNoteExists) {
        return prev
      }

      console.log('event', event)
      return parseStreamNote(event)
    })
  }

  useEffect(() => {
    nostrClient.subscribe('channel', filter, onEventCallback)

    return () => {
      setStream(null)
      nostrClient.unsubscribe('channel')
    }
  }, [])

  return stream
}
