import create from 'zustand/vanilla'

interface AuthedUser {
  pubkey: string | undefined
  status: undefined | 'loading' | 'authenticated' | 'unauthenticated'

  setPubkey: (pubkey: string) => void
  unsetUser: () => void
  setStatus: (status: undefined | 'loading' | 'authenticated' | 'unauthenticated') => void
  logout: () => void
}

const authedUserStore = create<AuthedUser>((set) => ({
  pubkey: undefined,
  status: undefined,
  setPubkey: (pubkey: string) => {
    set({ pubkey })
    set({ status: 'authenticated' })
  },
  unsetUser: () => {
    set({ pubkey: undefined })
  },
  setStatus: (status: undefined | 'loading' | 'authenticated' | 'unauthenticated') => {
    set({ status: status })
  },
  logout: () => {
    set({ pubkey: undefined })
  },
}))

export default authedUserStore
