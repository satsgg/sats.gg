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
  // const onEventCallback = (event: Event) => {
  //   setStreams((prev) => {
  //     // TODO: this whole thing sucks
  //     // if we get an ended and the same pubkey + 'd' is in streams with 'live' need to remove it
  //     let status = event.tags.find(([t, v]) => t === 'status' && v)
  //     if (status && status[1] && status[1] !== 'live') return prev

  //     // filter out duplicates
  //     const alreadyHaveNote = prev.some((a) => a.id === event.id)

  //     // TODO: This prevents us from seeing zap.stream stuff
  //     // const newerNoteExists = prev.some((a) => a.pubkey === event.pubkey && a.createdAt >= event.created_at)
  //     // want to allow same pubkey to have multiple 30311s w/ different 'd's...
  //     // but only keep newest of the e
  //     const newerNoteExists = prev.some((a) => a.createdAt >= event.created_at)
  //     if (alreadyHaveNote || newerNoteExists) {
  //       return prev
  //     }

  //     return [...prev.filter((stream) => stream.pubkey !== event.pubkey).slice(0, limit), parseStreamNote(event)]
  //   })
  // }
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
