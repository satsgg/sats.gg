import create from 'zustand/vanilla'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { nip19 } from 'nostr-tools'
import SettingsStore from './settingsStore'

type GetMeOutput = inferProcedureOutput<AppRouter['auth']['getMe']>

type AuthView = undefined | 'default' | 'pubkey' | 'authenticated'

interface AuthedUser {
  user: GetMeOutput
  pubkey: string | undefined
  privkey: string | undefined
  npub: string | undefined
  view: AuthView
  authToken: string | undefined

  setUser: (user: GetMeOutput) => void
  unsetUser: () => void
  setPubkey: (pubkey: string) => void
  setPrivatekey: (privkey: string) => void
  unsetPrivkey: () => void
  unsetPubkey: () => void
  setAuthToken: (token: string | undefined) => void
  setView: (view: AuthView) => void
  logout: () => void
}

const authedUserStore = create<AuthedUser>((set) => ({
  user: null,
  pubkey: undefined,
  privkey: undefined,
  npub: undefined,
  view: undefined,
  authToken: undefined,

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
  setPrivatekey: (privkey: string) => {
    set({ privkey })
    window.localStorage.setItem('privkey', privkey)
  },
  unsetPrivkey: () => {
    set({ privkey: undefined })
    window.localStorage.removeItem('privkey')
  },
  unsetPubkey: () => {
    set({ pubkey: undefined })
    window.localStorage.removeItem('pubkey')
  },
  setAuthToken: (authToken: string | undefined) => {
    set({ authToken })
    if (authToken) window.localStorage.setItem('token', authToken)
  },
  setView: (view: AuthView) => {
    set({ view: view })
    if (view) window.localStorage.setItem('view', view)
  },
  logout: () => {
    set({
      user: null,
      privkey: undefined,
      pubkey: undefined,
      npub: undefined,
      view: undefined,
      authToken: undefined,
      // relays: [],
    })

    SettingsStore.setState({
      follows: {
        follows: [],
        createdAt: 0,
      },
    })
    window.localStorage.removeItem('follows')
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('view')
    // window.localStorage.removeItem('relays')
  },
}))

export default authedUserStore
