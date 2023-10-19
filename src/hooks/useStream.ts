import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import { uniqBy } from '~/utils/nostr'

// will be constantly updated. need to only keep latest one
// convention is for relays to only store latest of 30311 events... no guaruntee though,
// we should still filter out for latest hereo
type Stream = {
  pubkey: string
  created_at: number
  id: string
  sig: string
  // tags
  d?: string // unique identifier
  title?: string
  summary?: string // description
  image?: string
  t?: string[] // hashtag
  streaming?: string // rtmp url
  recording?: string // used to place the edited video once the activity is over
  starts?: string // unix timestamp
  ends?: string // unix timestamp
  status?: 'planned' | 'live' | 'ended'
  current_participants?: number
  total_participants?: number
  p?: string[] // participants
  relays?: string[]
}

const parseStreamNote = (note: Event) => {
  const stream: Stream = {
    pubkey: note.pubkey,
    created_at: note.created_at,
    id: note.id,
    sig: note.sig,
  }
  let d = note.tags.find(([t, v]) => t === 'd' && v)
  if (d && d[1]) stream['d'] = d[1]

  let title = note.tags.find(([t, v]) => t === 'title' && v)
  if (title && title[1]) stream['title'] = title[1]

  let summary = note.tags.find(([t, v]) => t === 'summary' && v)
  if (summary && summary[1]) stream['summary'] = summary[1]

  let image = note.tags.find(([t, v]) => t === 'image' && v)
  if (image && image[1]) stream['image'] = image[1]

  // TODO: may be multiple hashtags
  let t = note.tags.find(([t, v]) => t === 't' && v)
  if (t && t[1]) stream['t'] = [t[1]]

  let streaming = note.tags.find(([t, v]) => t === 'streaming' && v)
  if (streaming && streaming[1]) stream['streaming'] = streaming[1]

  let recording = note.tags.find(([t, v]) => t === 'recording' && v)
  if (recording && recording[1]) stream['recording'] = recording[1]

  let starts = note.tags.find(([t, v]) => t === 'starts' && v)
  if (starts && starts[1]) stream['starts'] = starts[1]

  let ends = note.tags.find(([t, v]) => t === 'ends' && v)
  if (ends && ends[1]) stream['ends'] = ends[1]

  let status = note.tags.find(([t, v]) => t === 'status' && v)
  if (status && status[1]) stream['status'] = status[1] as 'planned' | 'live' | 'ended'

  // TODO: Number
  let cp = note.tags.find(([t, v]) => t === 'cp' && v)
  if (cp && cp[1]) stream['current_participants'] = cp[1]

  let tp = note.tags.find(([t, v]) => t === 'tp' && v)
  if (tp && tp[1]) stream['total_participants'] = tp[1]

  // TODO: Multiple
  let p = note.tags.find(([t, v]) => t === 'p' && v)
  if (p && p[1]) stream['p'] = [p[1]]

  return stream
}

// will be constantly updated. need to only keep latest one per pubkey
// if created_at is more than 1 hour old and status is live, we can consider it ended

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
