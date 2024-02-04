import { useEffect } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'
import useSettingsStore from './useSettingsStore'
import { Follows } from '~/utils/nostr'
import { SettingsState } from '~/store/settingsStore'

// TODO: Basic event format validation necessary?
const parseFollowListEvent = (event: Event) => {
  // if (!event.kind || event.kind !== 3 || !event.tags) return null
  try {
    const followsList = event.tags.map((t) => {
      if (t[0] === 'p' && t[1]) return t[1]
      throw new Error('invalid follows tags')
    })
    const follows: Follows = {
      follows: followsList,
      createdAt: event.created_at,
    }
    return follows
  } catch (e: any) {
    return null
  }
}

const useFollows = (pubkey: string | undefined) => {
  const follows = useSettingsStore((state) => state.follows)

  const filters: Filter[] = [
    {
      kinds: [3],
      authors: [pubkey || ''],
    },
  ]

  const onEventCallback = (event: Event) => {
    const parsedFollowListEvent = parseFollowListEvent(event)
    if (!parsedFollowListEvent) return
    // TODO: setFollows with prev state access?
    useSettingsStore.setState((prev: SettingsState) => {
      if (parsedFollowListEvent.createdAt <= prev.follows.createdAt) return prev

      const newState = {
        ...prev,
        follows: parsedFollowListEvent,
      }
      window.localStorage.setItem('follows', JSON.stringify(parsedFollowListEvent))
      return newState
    })
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
