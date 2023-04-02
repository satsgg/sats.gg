import create from 'zustand/vanilla'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { nip19 } from 'nostr-tools'

type GetMeOutput = inferProcedureOutput<AppRouter['auth']['getMe']>

interface AuthedUser {
  user: GetMeOutput | undefined
  pubkey: string | undefined
  npub: string | undefined
  status: undefined | 'loading' | 'view' | 'authenticated'
  authToken: string | undefined

  setUser: (user: GetMeOutput) => void
  unsetUser: () => void
  setPubkey: (pubkey: string) => void
  unsetPubkey: () => void
  setAuthToken: (token: string) => void
  unsetAuthToken: () => void
  setStatus: (status: undefined | 'loading' | 'view' | 'authenticated') => void
  logout: () => void
}

const authedUserStore = create<AuthedUser>((set) => ({
  user: undefined,
  pubkey: undefined,
  npub: undefined,
  status: undefined,
  authToken: '',

  setUser: (user: GetMeOutput) => {
    set({ user })
  },
  unsetUser: () => {
    set({ user: undefined })
  },
  setPubkey: (pubkey: string) => {
    set({ pubkey, npub: nip19.npubEncode(pubkey) })
    window.localStorage.setItem('pubkey', pubkey)
  },
  unsetPubkey: () => {
    set({ pubkey: undefined })
    window.localStorage.removeItem('pubkey')
  },
  setAuthToken: (authToken: string) => {
    set({ authToken })
    window.localStorage.setItem('token', authToken)
  },
  unsetAuthToken: () => {
    set({ authToken: '' })
  },
  setStatus: (status: undefined | 'loading' | 'view' | 'authenticated') => {
    set({ status: status })
  },
  logout: () => {
    set({ pubkey: undefined })
    set({
      pubkey: undefined,
      npub: undefined,
      user: undefined,
      authToken: '',
      // relays: [],
    })
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('pubkey')
    window.localStorage.removeItem('follows')
    // window.localStorage.removeItem('relays')
    localStorage.removeItem('token')
  },
}))

export default authedUserStore
