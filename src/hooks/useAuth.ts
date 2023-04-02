import { useEffect } from 'react'
import { trpc } from '~/utils/trpc'
import useAuthStore from './useAuthStore'

export default function useAuth() {
  const { setUser, setPubkey, setStatus, authToken, setAuthToken } = useAuthStore()
  const utils = trpc.useContext()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const pubkey = localStorage.getItem('pubkey')
    if (token) {
      setAuthToken(token)
    } else if (pubkey) {
      setPubkey(pubkey)
      setStatus('view')
    }

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
        })
    }
  }, [authToken])
}
