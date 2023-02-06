import create from 'zustand/vanilla'
import { nostrClient } from '~/nostr/NostrClient'

type State = {
  // TODO: store connection status
  relays: string[]
  // connectedRelays: string[]
}

type Actions = {
  init: () => void
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
  // TODO: Set initial state based off localStorage data
  // relays: window.localStorage.getItem('relays') || DEFAULT_RELAYS
  // use persist localstorage middleware?
  relays: DEFAULT_RELAYS,
  // relays: [],
}

// NOTE: This will become a logged in users session
const SettingsStore = create<State & Actions>((set, get) => ({
  ...initialState,

  init: () => {
    // from browser storage get
    // public key if available

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
