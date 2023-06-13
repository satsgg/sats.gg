import { useEffect, useRef, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'

export const useFetchZap = (pubkey: string | undefined, invoice: string | null, callback: () => void) => {
  const [zap, setZap] = useState<Event | null>(null)

  const now = useRef(Math.floor(Date.now() / 1000)) // Make sure current time isn't re-rendered
  const filters: Filter[] = [
    {
      kinds: [9735],
      // authors: [nostrPubkey || ''],
      since: now.current,
      '#p': [pubkey || ''],
    },
  ]

  const onEventCallback = (event: Event) => {
    const pk = event.tags.find((t) => t[0] == 'p')
    if (pk && pk[1] !== pubkey) return

    const bolt11 = event.tags.find((t) => t[0] == 'bolt11')
    if (bolt11 && bolt11[1] == invoice) {
      setZap(event)
      callback()
    }
  }

  useEffect(() => {
    if (pubkey && invoice) {
      nostrClient.subscribe('zap', filters, onEventCallback)
      return () => {
        nostrClient.unsubscribe('zap')
      }
    }
  }, [pubkey, invoice])

  return zap
}
