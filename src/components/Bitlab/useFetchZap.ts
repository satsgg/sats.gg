import { useEffect } from 'react'
import { DEFAULT_RELAYS } from '~/store/settingsStore'
import { Pool } from './Pool'
import { Event as NostrEvent } from 'nostr-tools'
import { parseZapRequest } from '~/utils/nostr'
import { streamPubkey } from './util'

export default function useFetchZap(invoice: string | null, callback: () => void) {
  useEffect(() => {
    if (!invoice) return
    console.log('subscribing to relays', DEFAULT_RELAYS)
    let sub = Pool.sub(DEFAULT_RELAYS, [
      {
        kinds: [9735],
        '#p': [streamPubkey],
        since: Math.floor(Date.now() / 1000),
      },
    ])

    sub.on('event', (event: NostrEvent<9735>) => {
      const pk = event.tags.find((t) => t[0] == 'p')
      if (pk && pk[1] !== streamPubkey) return

      // TODO: verify invoice amount === zap request amount

      const bolt11 = event.tags.find((t) => t[0] == 'bolt11')
      if (!bolt11 || bolt11[1] !== invoice) return

      const zapRequestTag = event.tags.find((t) => t[0] == 'description')
      if (!zapRequestTag || !zapRequestTag[1]) return

      const zapRequest: NostrEvent<9734> = JSON.parse(zapRequestTag[1])
      const zap = parseZapRequest(zapRequest)
      if (!zap) return

      callback()
    })

    return () => {
      Pool.close(DEFAULT_RELAYS)
    }
  }, [invoice])
}
