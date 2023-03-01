import { useEffect} from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from './useSettingsStore'

const useFollows = (pubkey: string | undefined) => {
  // caching?
  // shallow? see zustand docs
  // pubkey undefined ts?
  const [follows, setFollows] = useSettingsStore(state => [state.follows, state.setFollows])

  const filters: Filter[] = [
    {
      kinds: [3],
      // TODO: use chat channel ID corresponding to channelPubkey
      authors: [pubkey],
    },
  ]

  const onEventCallback = (event: Event) => {
    const newnew = event.tags.map((t) => t[1])
    setFollows(newnew)
  }

  useEffect(() => {
    if (pubkey) {
      nostrClient.subscribe('follows', filters, onEventCallback)

      return () => {
        nostrClient.unsubscribe('follows')
      }
    }
  }, [pubkey])

  return follows
}

export default useFollows
