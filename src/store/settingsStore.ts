import create from 'zustand/vanilla'
import { nostrClient } from '~/nostr/NostrClient'
import { nip19 } from 'nostr-tools'

type State = {
  // TODO: store connection status
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
  setFollows: (follows: string[]) => void
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
    console.debug('Getting pubkey')
    const pubkey = window.localStorage.getItem('pubkey')
    console.debug('pubkey', pubkey)
    if (pubkey) {
      set({ pubkey: pubkey })
      set({ npub: nip19.npubEncode(pubkey) })
      console.debug('npub', nip19.npubEncode(pubkey))
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

    const follows = window.localStorage.getItem('follows')
    // what if logging in with diff pubkey?
    // will be different follows list... diff relays list...
    if (follows) {
      set({follows: JSON.parse(follows)})
    }
  },

  setPubkey: (pubkey: string) => {
    set({ pubkey: pubkey })
    set({ npub: nip19.npubEncode(pubkey) })
    console.debug('npub', nip19.npubEncode(pubkey))
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

  setFollows: (follows: string[]) => {
    const f = [...get().follows, ...follows]
    const newF = [...new Set(f)]
    set({ follows: newF })
    window.localStorage.setItem('follows', JSON.stringify(newF))
  },
}))

export default SettingsStore
