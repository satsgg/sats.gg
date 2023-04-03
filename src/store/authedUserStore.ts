import create from 'zustand/vanilla'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { nip19 } from 'nostr-tools'
import SettingsStore from './settingsStore'

type GetMeOutput = inferProcedureOutput<AppRouter['auth']['getMe']>

type AuthStatus = undefined | 'loading' | 'view' | 'authenticated' | 'unauthenticated'

interface AuthedUser {
  user: GetMeOutput
  pubkey: string | undefined
  npub: string | undefined
  status: AuthStatus
  authToken: string | undefined

  setUser: (user: GetMeOutput) => void
  unsetUser: () => void
  setPubkey: (pubkey: string) => void
  unsetPubkey: () => void
  setAuthToken: (token: string) => void
  unsetAuthToken: () => void
  setStatus: (status: AuthStatus) => void
  logout: () => void
}

const authedUserStore = create<AuthedUser>((set) => ({
  user: null,
  pubkey: undefined,
  npub: undefined,
  status: undefined,
  authToken: '',

  setUser: (user: GetMeOutput) => {
    set({ user })
  },
  unsetUser: () => {
    set({ user: null })
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
  setStatus: (status: AuthStatus) => {
    set({ status: status })
  },
  logout: () => {
    set({
      user: null,
      pubkey: undefined,
      npub: undefined,
      status: 'unauthenticated',
      authToken: '',
      // relays: [],
    })
    SettingsStore.setState({ follows: [] })

    window.localStorage.removeItem('token')
    window.localStorage.removeItem('pubkey')
    window.localStorage.removeItem('follows')
    // window.localStorage.removeItem('relays')
    window.localStorage.removeItem('token')
  },
}))

export default authedUserStore
