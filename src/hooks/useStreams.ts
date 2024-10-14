import { useEffect, useState, useMemo, useCallback } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import { Stream, parseStreamNote, uniqBy } from '~/utils/nostr'

export const useStreams = (id: string, pubkeys: string[] | null = null, reverse = false, limit: number = 500) => {
  const [streams, setStreams] = useState<Stream[]>([])

  const filter: Filter[] = useMemo(
    () => [
      {
        kinds: [30311],
        authors: pubkeys ? pubkeys : undefined,
        since: Math.floor(Date.now() / 1000) - 3600,
      },
    ],
    [pubkeys],
  )

  const onEventCallback = useCallback((event: Event) => {
    const stream = parseStreamNote(event)
    if (!stream) {
      console.debug('stream is null')
      return
    }
    setStreams((prevStreams) => {
      const alreadyHaveNote = prevStreams.some((ps) => ps.id === stream.id)
      if (alreadyHaveNote) return prevStreams

      const newerNoteExists = prevStreams.some(
        (ps) => ps.pubkey === stream.pubkey && ps.d === stream.d && ps.createdAt >= stream.createdAt,
      )
      if (newerNoteExists) return prevStreams

      return [...prevStreams.filter((ps) => ps.pubkey !== stream.pubkey || ps.d !== stream.d), stream]
    })
  }, [])

  useEffect(() => {
    if (filter.length > 0) {
      nostrClient.subscribe(id, filter, onEventCallback)
      return () => nostrClient.unsubscribe(id)
    }
  }, [id, filter, onEventCallback])

  return useMemo(() => {
    const uniqEvents = streams.length > 0 ? uniqBy(streams, 'id') : []
    return reverse
      ? uniqEvents.sort((b, a) => a.createdAt - b.createdAt)
      : uniqEvents.sort((b, a) => b.createdAt - a.createdAt)
  }, [streams, reverse])
}
