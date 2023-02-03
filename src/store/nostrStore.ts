import create from 'zustand/vanilla'

type State = {
  connectedRelays: number
  // relays: number
  relays: string[]
}

const initialState: State = {
  connectedRelays: 0,
  relays: [],
}

type Actions = {
  setConnectedRelays: (num: number) => void
}

const nostrStore = create<State & Actions>((set, get) => ({
  ...initialState,

  setConnectedRelays: (num) => {
    set({ connectedRelays: num })
  },
}))

export default nostrStore
