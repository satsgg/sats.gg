import { useEffect, useState } from 'react'
import { trpc } from '~/utils/trpc'
import { generatePrivateKey, getPublicKey } from 'nostr-tools'
import { validHexKey } from '~/utils/nostr'
import useAuthStore from './useAuthStore'

export default function useAuth() {
  const { user, setUser, setPubkey, setPrivatekey, unsetPrivkey, view, setView, authToken, setAuthToken, logout } =
    useAuthStore()
  const utils = trpc.useContext()

  const [shouldReset, setShouldReset] = useState(false)
  const reset = () => {
    console.warn('Invalid authentication state. Logging out and resetting.')
    logout()
    setShouldReset((prev) => !prev)
  }

  useEffect(() => {
    const localPubkey = localStorage.getItem('pubkey')
    const localPrivkey = localStorage.getItem('privkey')
    const localAuthToken = localStorage.getItem('token')
    const localView = localStorage.getItem('view')

    if (!localView) {
      const defaultPrivkey = generatePrivateKey()
      setPrivatekey(defaultPrivkey)
      setPubkey(getPublicKey(defaultPrivkey))
      setView('default')
    } else if (localView === 'default') {
      if (!localPrivkey) return reset()
      setPrivatekey(localPrivkey)
      setPubkey(getPublicKey(localPrivkey))
      setView('default')
    } else if (localView === 'pubkey') {
      if (!localPubkey || !validHexKey(localPubkey)) return reset()
      setPubkey(localPubkey)
      unsetPrivkey()
      setView('pubkey')
    } else if (localView === 'authenticated') {
      if (!localPubkey || !validHexKey(localPubkey) || !localAuthToken) return reset()
      if (!authToken) {
        return setAuthToken(localAuthToken)
      }

      // used for page refresh
      if (!view || !user) {
        utils.auth.getMe
          .fetch()
          .then((data) => {
            if (!data) {
              console.error('auth getMe response was empty')
              return reset()
            }
            setUser(data)
            setPubkey(data.publicKey)
            setView('authenticated')
            unsetPrivkey()
          })
          .catch((error) => {
            console.error('Error authenticating', error)
            return reset()
          })
      }
    } else {
      return reset()
    }
  }, [authToken, view, shouldReset])
}
