import { useEffect } from 'react'
import { trpc } from '~/utils/trpc'
import useAuthStore from './useAuthStore'

export default function useAuth() {
  const { setUser, setPubkey, setStatus, authToken, setAuthToken } = useAuthStore()
  const utils = trpc.useContext()

  useEffect(() => {
    const pubkey = localStorage.getItem('pubkey')
    const token = localStorage.getItem('token')

    if (pubkey) setPubkey(pubkey)
    if (token) setAuthToken(token)
    if (pubkey && !token) {
      console.debug('setting view status')
      setStatus('view')
    }
    if (!pubkey && !token) {
      console.debug('setting unauthenticated')
      setStatus('unauthenticated')
    }

    if (authToken) {
      console.debug('fetching0')
      utils.auth.getMe
        .fetch()
        .then((data) => {
          setUser(data)
          setPubkey(data.publicKey!)
          console.debug('fetching1')
          setStatus('authenticated')
        })
        .catch((error) => {
          console.error('errorrrrr', error)
          console.debug('fetching2')
          setStatus('unauthenticated')
        })
    }
  }, [authToken])
}
