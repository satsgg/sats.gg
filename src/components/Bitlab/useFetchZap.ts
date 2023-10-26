import { useEffect, useRef } from 'react'
import { DEFAULT_RELAYS } from '~/store/settingsStore'
import { Pool } from './Pool'
import { Event as NostrEvent } from 'nostr-tools'
import { parseZapRequest } from '~/utils/nostr'
import { streamPubkey } from './util'

export default function useFetchZap(invoice: string | null, callback: () => void) {
  const now = useRef(Math.floor(Date.now() / 1000))

  useEffect(() => {
    if (!invoice) return
    console.log('subscribing to relays', DEFAULT_RELAYS)
    let sub = Pool.sub(DEFAULT_RELAYS, [
      {
        kinds: [9735],
        // TODO: my pubkey? where i'm streaming?
        '#p': [streamPubkey],
        since: now.current,
      },
    ])

    sub.on('event', (event: NostrEvent) => {
      const pk = event.tags.find((t) => t[0] == 'p')
      if (pk && pk[1] !== streamPubkey) return

      // TODO: verify invoice amount === zap request amount

      const bolt11 = event.tags.find((t) => t[0] == 'bolt11')
      console.debug('bolt11', bolt11)
      // need to make sure it's the invoice we generated
      // if (bolt11 && bolt11[1] == invoice) {
      //   callback()
      // }

      console.log('event', event)
      const zapRequest = parseZapRequest(event)
      console.log('zap request', zapRequest)
      if (!zapRequest) return // if bad zap show error?

      console.log('FOUND ZAP')
      callback()
    })

    return () => {
      Pool.close(DEFAULT_RELAYS)
    }
  }, [invoice])
}
