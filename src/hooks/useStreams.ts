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
      // nobody seems to be updating their 30311s every hour
      since: Math.floor(Date.now() / 1000) - 3600,
      // '#status': ['live'], // this doesn't really work
    },
  ]

  // TODO: Need to account for an "ended" live event...
  // this is only considering the latest "live" events
  const onEventCallback = (event: Event) => {
    setStreams((prev) => {
      // TODO: this whole thing sucks
      let status = event.tags.find(([t, v]) => t === 'status' && v)
      if (status && status[1] && status[1] !== 'live') return prev

      const alreadyHaveNote = prev.some((a) => a.id === event.id)
      const newerNoteExists = prev.some((a) => a.pubkey === event.pubkey && a.createdAt >= event.created_at)
      if (alreadyHaveNote || newerNoteExists) {
        return prev
      }

      return [...prev.filter((stream) => stream.pubkey !== event.pubkey).slice(0, limit), parseStreamNote(event)]
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

  const uniqEvents = streams.length > 0 ? uniqBy(streams, 'id') : []
  if (reverse) return uniqEvents.sort((b, a) => a.created_at - b.created_at)
  return uniqEvents.sort((b, a) => b.created_at - a.created_at)
}
