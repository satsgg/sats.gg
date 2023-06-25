import { useEffect, useState } from 'react'
import { trpc } from '~/utils/trpc'
import { generatePrivateKey, getPublicKey } from 'nostr-tools'
import { validHexKey } from '~/utils/nostr'
import useAuthStore from './useAuthStore'

export default function useAuth() {
  const { setUser, setPubkey, setPrivatekey, unsetPrivkey, view, setView, authToken, setAuthToken, logout } =
    useAuthStore()
  const utils = trpc.useContext()

  const [shouldReset, setShouldReset] = useState(false)
  const reset = () => {
    console.warn('Invalid authentication state. Logging out and resetting.')
    logout()
    setShouldReset((prev) => !prev)
  }

  useEffect(() => {
    const pubkey = localStorage.getItem('pubkey')
    const privkey = localStorage.getItem('privkey')
    const token = localStorage.getItem('token')
    const view = localStorage.getItem('view')
    // console.debug('useAuth effect', 'pubkey', pubkey, 'privkey', privkey, 'token', token, 'view', view)

    if (!view) {
      const defaultPrivkey = generatePrivateKey()
      setPrivatekey(defaultPrivkey)
      setPubkey(getPublicKey(defaultPrivkey))
      setView('default')
    } else if (view === 'default') {
      if (!privkey) return reset()
      setPubkey(getPublicKey(privkey))
      setView('default')
    } else if (view === 'pubkey') {
      if (!pubkey || !validHexKey(pubkey)) return reset()
      setPubkey(pubkey)
      unsetPrivkey()
      setView('pubkey')
    } else if (view === 'authenticated') {
      if (!pubkey || !validHexKey(pubkey) || !token) return reset()
      if (!authToken) {
        return setAuthToken(token)
      }

      utils.auth.getMe
        .fetch()
        .then((data) => {
          if (!data) {
            console.error('auth getMe response was empty')
            return reset()
          }
          setUser(data)
          setPubkey(data.publicKey)
          unsetPrivkey()
        })
        .catch((error) => {
          console.error('Error authenticating', error)
          return reset()
        })
    } else {
      return reset()
    }
  }, [authToken, view, shouldReset])
}
