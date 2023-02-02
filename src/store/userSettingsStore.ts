import create from 'zustand/vanilla'

type State = {
  relays: string[]
}

type Actions = {
  addRelay: (url: string) => void
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
}

const Settings = create<State & Actions>((set) => ({
  ...initialState,

  addRelay: (url: string) => {
    set((state) => ({ relays: [...state.relays, url] }))
  },
}))

export default Settings
