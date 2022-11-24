import create from 'zustand/vanilla'
import { inferProcedureOutput } from '@trpc/server'
import { AppRouter } from '~/server/routers/_app'
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator'

type GetMeOutput = inferProcedureOutput<AppRouter['auth']['getMe']>

interface AuthedUser {
  user: GetMeOutput | undefined
  status: undefined | 'loading' | 'authenticated' | 'unauthenticated'
  setUser: (user: GetMeOutput) => void
  unsetUser: () => void
  setStatus: (status: undefined | 'loading' | 'authenticated' | 'unauthenticated') => void
  storeToken: string
  setStoreToken: (token: string) => void
  unsetStoreToken: () => void
  storeLogin: (token: string) => void
  logout: () => void
  storeNym: string | undefined
  setNym: () => void
  unsetNym: () => void
  showBalance: boolean
  setShowBalance: (shouldShow: boolean) => void
}

const authedUserStore = create<AuthedUser>((set) => ({
  user: undefined,
  status: undefined,
  setUser: (user: GetMeOutput) => {
    set({ user })
    set({ status: 'authenticated' })
  },
  unsetUser: () => {
    set({ user: undefined })
  },
  setStatus: (status: undefined | 'loading' | 'authenticated' | 'unauthenticated') => {
    set({ status: status })
  },
  storeToken: '',
  setStoreToken: (storeToken: string) => {
    set({ storeToken })
  },
  unsetStoreToken: () => {
    set({ storeToken: '' })
  },
  storeLogin: async (token) => {
    set({ status: 'loading' })
    localStorage.setItem('token', token)
    set({ storeToken: token })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: undefined, storeToken: '' })
  },
  storeNym: undefined,
  setNym: () => {
    const newNym: string = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, colors], // colors can be omitted here as not used
      separator: '-',
      length: 2,
    })
    // value is a string. can jsonify an object
    // { exp: 1285318, name: 'Orange-Rhino', ...}
    // problem is a user can manipulate it?
    // Could make the nym a token like the user auth token
    // it won't be passed as context to server, but maybe the server
    // could still sign it?
    // could have a list in db of active nym names or something
    // so no 2 people have the same one
    // would also protect the nym localstorage data
    // do we even care? it was really only so someone gets the same username
    // for 24 hours...
    // issue is they could change their own username lmao
    // that's why it would need to be signed etc
    // NOTE: It actually doesn't update when i manually change via the localStorage...
    // probably because i'm reading it from our JS var instead of localstorage and it's not getting
    // updated when i manually edit

    localStorage.setItem('nym', newNym)
    // Also add a nym expiration date?
    set({ storeNym: newNym })
  },
  unsetNym: () => {
    localStorage.removeItem('nym')
    set({ storeNym: undefined })
  },
  showBalance: false,
  setShowBalance: (shouldShow: boolean) => {
    localStorage.setItem('showBalance', shouldShow.toString())
    set({ showBalance: shouldShow })
  },
}))

export default authedUserStore
