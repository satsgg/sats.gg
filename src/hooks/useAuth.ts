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
    if (pubkey && !token) setStatus('view')
    if (!pubkey && !token) setStatus('unauthenticated')

    if (authToken) {
      utils.auth.getMe
        .fetch()
        .then((data) => {
          setUser(data)
          setPubkey(data.publicKey!)
          setStatus('authenticated')
        })
        .catch((error) => {
          console.error('errorrrrr', error)
          setStatus('unauthenticated')
        })
    }
  }, [authToken])
}
