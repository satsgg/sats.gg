import create from 'zustand/vanilla'
import { nostrClient } from '~/nostr/NostrClient'
import { nip19, Event } from 'nostr-tools'

type State = {
  pubkey: string | undefined
  npub: string | undefined
  relays: string[]
  follows: string[]
}

type Actions = {
  init: () => void
  setPubkey: (pubkey: string) => void
  logout: () => void
  addRelay: (url: string) => void
  removeRelay: (url: string) => void
  setFollows: (event: Event) => void
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
  npub: undefined,
  relays: DEFAULT_RELAYS,
  follows: [],
}

// NOTE: This will become a logged in users session
const SettingsStore = create<State & Actions>((set, get) => ({
  ...initialState,

  init: () => {
    // from browser storage get
    // public key if available
    const pubkey = window.localStorage.getItem('pubkey')
    if (pubkey) {
      set({ pubkey: pubkey })
      set({ npub: nip19.npubEncode(pubkey) })
    }

    // relays if available
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
      set({ follows: JSON.parse(follows) })
    }
  },

  setPubkey: (pubkey: string) => {
    set({ pubkey: pubkey })
    set({ npub: nip19.npubEncode(pubkey) })
    console.debug('npub', nip19.npubEncode(pubkey))
    window.localStorage.setItem('pubkey', pubkey)
  },

  logout: () => {
    set({
      pubkey: undefined,
      npub: undefined,
      follows: [],
      // relays: [],
    })
    window.localStorage.removeItem('pubkey')
    window.localStorage.removeItem('follows')
    // window.localStorage.removeItem('relays')
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

  setFollows: (event: Event) => {
    if (!event.tags) return
    const follows = event.tags.map((t) => t[1])
    set({ follows: follows })
    window.localStorage.setItem('follows', JSON.stringify(follows))
  },
}))

export default SettingsStore
