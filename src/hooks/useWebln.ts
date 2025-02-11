import { useEffect, useState } from 'react'
import { Event as NostrEvent } from 'nostr-tools'

declare global {
  interface Window {
    webln: any
  }
}

interface SendPaymentResponse {
  preimage: string
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

  const enableWebln = async () => {
    try {
      console.debug('WAITING FOR WEBLN ENABLE...')
      await window.webln.enable()
      console.debug('WEBLN ENABLED!')
    } catch (e) {
      console.error('User disabled webln')
      setEnabled(false)
      return false
    }
    setEnabled(true)
    return true
  }

  // TODO: Should throw
  const weblnPay = async (invoice: string): Promise<{ success: boolean; preimage: string; error: any }> => {
    if (typeof enabled === 'undefined' && !(await enableWebln())) {
      return {
        success: false,
        preimage: '',
        error: 'User disabled webln',
      }
    }

    try {
      let response: SendPaymentResponse = await window.webln.sendPayment(invoice)
      console.debug('WebLN payment response:', response)
      return {
        success: true,
        preimage: response.preimage,
        error: null,
      }
    } catch (e: any) {
      // TODO: Set user preference here... if they declined to use ext to pay,
      // they most likely are using an external LN wallet to pay
      // want to just auto open the invoice then.
      // NOTE: Not seeing any debug logs anywhere in this hook...
      return {
        success: false,
        preimage: '',
        error: e,
      }
    }
    // return true
  }

  // window.webln: {
  //     "enabled": true,
  //     "isEnabled": true,
  //     "executing": false
  // }

  useEffect(() => {
    if (window.webln) {
      setAvailable(true)
    }
  }, [])

  return { available, enabled, enableWebln, weblnPay }
}

export default useWebln
