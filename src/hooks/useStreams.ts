import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import { Stream, parseStreamNote, uniqBy } from '~/utils/nostr'

export const useStreams = (id: string, pubkeys: string[] | null = null, reverse = false, limit: number = 500) => {
  const [streams, setStreams] = useState<Stream[]>([])

  const filter: Filter[] = [
    {
      kinds: [30311],
      authors: pubkeys ? pubkeys : undefined,
      since: Math.floor(Date.now() / 1000) - 3600,
    },
  ]

  const onEventCallback = (event: Event) => {
    const stream = parseStreamNote(event)
    if (!stream) return
    // use stream.pubkey, stream.d as combined unique identifier
    setStreams((prevStreams) => {
      // handle duplicate event ID
      const alreadyHaveNote = prevStreams.some((ps) => ps.id === stream.id)
      if (alreadyHaveNote) return prevStreams

      // only keep latest
      const newerNoteExists = prevStreams.some(
        (ps) => ps.pubkey === stream.pubkey && ps.d === stream.d && ps.createdAt >= stream.createdAt,
      )
      if (newerNoteExists) {
        return prevStreams
      }

      // replace existing stream note if it exists and add the new one to the list
      return [...prevStreams.filter((ps) => ps.pubkey !== stream.pubkey && ps.d !== stream.d), stream]
    })
  }

  useEffect(() => {
    if (filter.length > 0) {
      nostrClient.subscribe(id, filter, onEventCallback)

      return () => {
        setStreams([])
        nostrClient.unsubscribe(id)
      }
    }
  }, [pubkeys])

  // TODO: filter for 'live' only? arg?
  const uniqEvents = streams.length > 0 ? uniqBy(streams, 'id') : []
  if (reverse) return uniqEvents.sort((b, a) => a.createdAt - b.createdAt)
  return uniqEvents.sort((b, a) => b.createdAt - a.createdAt)
}
