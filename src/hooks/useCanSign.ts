import { useState, useEffect } from 'react'
const useCanSign = () => {
  const [canSign, setCanSign] = useState(false)

  useEffect(() => {
    setCanSign(window.hasOwnProperty('nostr'))
  }, [])

  return canSign
}

export default useCanSign
