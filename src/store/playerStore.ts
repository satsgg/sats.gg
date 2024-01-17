import create from 'zustand'
import { persist } from 'zustand/middleware'

type State = {
  volume: number
}

type Actions = {
  adjustVolume: (volume: number) => void
}

const initialState = {
  volume: 1,
}

export const usePlayerStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      adjustVolume: (volume) => set({ volume: volume }),
    }),
    {
      name: 'player',
    },
  ),
)

export default usePlayerStore
