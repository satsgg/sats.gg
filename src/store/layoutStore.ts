import create from 'zustand'
import { persist } from 'zustand/middleware'

type State = {
  leftBarUserClosed: boolean
  rightBarUserClosed: boolean
}

type Actions = {
  userCloseLeftBar: (close: boolean) => void
  userCloseRightBar: (close: boolean) => void
}

const initialState = {
  leftBarUserClosed: false,
  rightBarUserClosed: false,
}

export const useLayoutStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      userCloseLeftBar: (close) => set({ leftBarUserClosed: close }),
      userCloseRightBar: (close) => set({ rightBarUserClosed: close }),
    }),
    {
      name: 'layout',
    },
  ),
)

export default useLayoutStore
