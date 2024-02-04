import create from 'zustand/vanilla'
import { nostrClient } from '~/nostr/NostrClient'
import { Follows } from '~/utils/nostr'

export type SettingsState = {
  relays: string[]
  follows: Follows
}

type Actions = {
  init: () => void
  addRelay: (url: string) => void
  removeRelay: (url: string) => void
  setFollows: (follows: Follows) => void
  unsetFollows: () => void
}

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nostr.fmt.wiz.biz',
  'wss://arc1.arcadelabs.co',
  'wss://eden.nostr.land',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.current.fyi',
]

const initialState = {
  relays: DEFAULT_RELAYS,
  follows: { follows: [], createdAt: 0 },
}

const SettingsStore = create<SettingsState & Actions>((set, get) => ({
  ...initialState,

  init: () => {
    const initRelays = window.localStorage.getItem('relays')
    let relaysToConnect: string[] = []
    if (initRelays) {
      relaysToConnect = JSON.parse(initRelays)
      set({ relays: relaysToConnect })
    } else {
      // Start with default list
      relaysToConnect = get().relays
      window.localStorage.setItem('relays', JSON.stringify(relaysToConnect))
    }

    relaysToConnect.forEach((relay) => {
      nostrClient.addRelay(relay)
    })

    const follows = window.localStorage.getItem('follows')
    if (follows) {
      const parsedFollows = JSON.parse(follows)
      if (!parsedFollows.follows) {
        set({ follows: { follows: [], createdAt: 0 } })
        window.localStorage.removeItem('follows')
      } else {
        set({ follows: JSON.parse(follows) })
      }
    }
  },

  addRelay: (url: string) => {
    console.debug('adding relay: ', url)
    // don't add if it's already there
    // double verify valid relay url
    const relays = window.localStorage.getItem('relays')
    if (relays) {
      window.localStorage.setItem('relays', JSON.stringify([...JSON.parse(relays), url]))
    }

    set((state) => ({
      relays: [...state.relays, url],
    }))

    nostrClient.addRelay(url)
    nostrClient.connectToRelay(url)
  },

  removeRelay: (url: string) => {
    console.debug('removing relay: ', url)
    const relays = window.localStorage.getItem('relays')
    if (relays) {
      window.localStorage.setItem('relays', JSON.stringify(JSON.parse(relays).filter((r: string) => r !== url)))
    }

    set((state) => ({
      relays: state.relays.filter((r) => r !== url),
    }))

    nostrClient.removeRelay(url)
  },

  // TODO: setFollows with prev state for useFollows
  setFollows: (follows: Follows) => {
    set({ follows: follows })
    window.localStorage.setItem('follows', JSON.stringify(follows))
  },

  unsetFollows: () => {
    set({ follows: { follows: [], createdAt: 0 } })
    window.localStorage.removeItem('follows')
  },
}))

export default SettingsStore
