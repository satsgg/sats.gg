import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import { Stream, parseStreamNote, uniqBy } from '~/utils/nostr'

export const useStream = (pubkey: string, d?: string) => {
  const [stream, setStream] = useState<Stream | null>(null)

  const filter: Filter[] = [
    {
      kinds: [30311],
      authors: [pubkey],
    },
  ]
  if (d) filter[0]!['#d'] = [d]

  const onEventCallback = (event: Event) => {
    const stream = parseStreamNote(event)
    if (!stream) return

    setStream((prev) => {
      if (!prev) {
        console.log('event', event)
        return parseStreamNote(event)
      }
      const alreadyHaveNote = prev.id === event.id
      const newerNoteExists = prev.createdAt >= event.created_at
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
  }, [pubkey])

  return stream
}
