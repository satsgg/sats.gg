import create from 'zustand/vanilla'

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
  // connectedRelays: []
}

// NOTE: This will become a logged in users session
const SettingsStore = create<State & Actions>((set, get) => ({
  ...initialState,

  init: () => {
    // from browser storage get
    // public key if available

    // relays if available
    const initRelays = window.localStorage.getItem('relays')
    if (initRelays) {
      set({ relays: JSON.parse(initRelays)})
      console.debug('init relays json parse: ', JSON.parse(initRelays))
    } 
    // else {
    //   // store default set of relays
    //   // should we even save it? doesn't matter really...
    //   window.localStorage.setItem('relays', JSON.stringify(get().relays))
    // }
  },

  addRelay: (url: string) => {
    console.debug('adding relay: ', url)
    // don't add if it's already there
    // double verify valid relay url
    set((state) => ({
      relays: [...state.relays, url]
    }))
  },

  removeRelay: (url: string) => {
    // console.debug('removing relay: ', url)
    // let newRelays = new Set(get().relays)
    // newRelays.delete(url)
    // set({ relays: new Set(newRelays) })
    set((state) => ({
      relays: state.relays.filter(r => r === url)
    }))
  }

}))

export default SettingsStore
