import { useEffect, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from './useSettingsStore'

const useFollows = (pubkey: string ) => {
  const [notes, setNotes] = useState<Event[]>([])
  const [follows, setFollows] = useState<string[]>([])
  // const [follows, setFollows] = useSettingsStore(state => [state.follows, state.setFollows])
  // const [follows, setFollows] = useSettingsStore(state => [state.follows, state.setFollows])

  const filters: Filter[] = [
    {
      kinds: [3],
      // TODO: use chat channel ID corresponding to channelPubkey
      authors: [pubkey]
    }
  ]

  const onEventCallback = (event: Event) => {
    // console.log('yeet', event.tags.map((t) => t[1]))
    setFollows((prev) => {
      // console.log('prev', prev)
      // return [...prev, ...[...new Set(event.tags.map((t) => t[1]))]]
      const newnew= [...prev, ...event.tags.map((t) => t[1])]
      return [...new Set(newnew)]
      // console.log('returning', [...new Set([...prev, event.tags.map((t) => t[1]) ])]) 
      // return [...new Set([... new Set(prev), new Set(event.tags.map((t) => t[1]) ) ]) ]
    })
    // console.log(event.tags.map((t) => t[1]))

    // setNotes((prev) => {
    //   if (prev.some((a) => a.id === event.id)) {
    //     return prev
    //   }
    //   // return [...prev, ...new Set(event.p)]
    //   console.log('useFollows event', event)

    //   // before settings the event into the list
    //   // check store for event.pubkey kind5 metadata

    //   return [...prev, event]
    // })
  }

  useEffect(() => {
    nostrClient.subscribe('follows', filters, onEventCallback)

    return () => {
      nostrClient.unsubscribe('follows')
    }
  }, [pubkey])
  
  // return notes
  return follows
}

export default useFollows