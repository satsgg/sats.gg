import { useState, useEffect } from 'react'
import useAuthStore from './useAuthStore'

const useCanSign = () => {
  const view = useAuthStore((state) => state.view)
  const [canSign, setCanSign] = useState(false)

  useEffect(() => {
    if (view === 'default') setCanSign(true)
    else if (view === 'pubkey') setCanSign(false)
    else if (view === 'authenticated' && window.hasOwnProperty('nostr')) setCanSign(true)
    else setCanSign(false)
  }, [view])

  return canSign
}

export default useCanSign
