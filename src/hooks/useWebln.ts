import { useEffect, useState } from 'react'
import { Event as NostrEvent } from 'nostr-tools'

declare global {
  interface Window {
    webln: any
  }
}

const useWebln = () => {
  const [available, setAvailable] = useState(false)
  const [enabled, setEnabled] = useState<undefined | boolean>(undefined)

  const signZap = async (zapRequestEvent: NostrEvent) => {
    try {
      // Requests from ext
      // 1. Connect: If app not enabled (enabled after sign in... but can be "signed in" by manually remove sats.gg)
      //   Allow this website to:
      //    * Request approval for transactions
      //    * Request invoices and lightning information
      // 2. Nostr: Allow sats.gg to sign a zap request: (nostr specific...

      await window.nostr.signEvent(zapRequestEvent)
    } catch (e) {
      // if e contains "User rejected" it's all good...
      // jk... same error response if user declines #1
      // really can't handle it then
    }
  }
  // state handled externally by extension?
  // would it just auto fail an attempted webln payment if user blocks app?
  const enableWebln = async () => {
    try {
      await window.webln.enable()
    } catch (e) {
      console.error('User disabled webln')
      setEnabled(false)
      return false
    }
    setEnabled(true)
    return true
  }

  const weblnPay = async (invoice: string) => {
    if (typeof enabled === 'undefined' && !(await enableWebln())) {
      return false
    }

    try {
      await window.webln.sendPayment(invoice)
    } catch (e) {
      console.error('WebLn payment failed', e)
      return false
    }
    return true
  }

  useEffect(() => {
    if (window.webln) {
      setAvailable(true)
    }
  }, [])

  return { available, enabled, enableWebln, weblnPay }
}

export default useWebln
