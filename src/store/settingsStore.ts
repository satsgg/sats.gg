import create from 'zustand/vanilla'
import { nostrClient } from '~/nostr/NostrClient'

type State = {
  // TODO: store connection status
  pubkey: string | undefined
  relays: string[]
}

type Actions = {
  init: () => void
  setPubkey: (pubkey: string) => void
  logout: () => void
  addRelay: (url: string) => void
  removeRelay: (url: string) => void
}

const DEFAULT_RELAYS = [
  'wss://brb.io',
  'wss://relay.damus.io',
  'wss://nostr.fmt.wiz.biz',
  'wss://nostr.oxtr.dev',
  'wss://arc1.arcadelabs.co',
  'wss://relay.nostr.ch',
  'wss://eden.nostr.land',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.current.fyi',
]

const initialState = {
  pubkey: undefined,
  relays: DEFAULT_RELAYS,
}

// NOTE: This will become a logged in users session
const SettingsStore = create<State & Actions>((set, get) => ({
  ...initialState,

  init: () => {
    // from browser storage get
    // public key if available
    const pubkey = window.localStorage.getItem('pubkey')
    console.debug('pubkey', pubkey)
    if (pubkey) {
      set({ pubkey: pubkey })
    }

    // relays if available
    const initRelays = window.localStorage.getItem('relays')
    let relaysToConnect: string[] = []
    if (initRelays) {
      relaysToConnect = JSON.parse(initRelays)
      set({ relays: relaysToConnect })
      console.debug('init relays json parse: ', JSON.parse(initRelays))
    } else {
      // Start with default list
      relaysToConnect = get().relays
      window.localStorage.setItem('relays', JSON.stringify(relaysToConnect))
    }
    relaysToConnect.forEach((relay) => {
      nostrClient.addRelay(relay)
    })
  },

  setPubkey: (pubkey: string) => {
    set({ pubkey: pubkey })
    window.localStorage.setItem('pubkey', pubkey)
  },

  logout: () => {
    set({ pubkey: undefined })
    window.localStorage.removeItem('pubkey')
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
}))

export default SettingsStore
