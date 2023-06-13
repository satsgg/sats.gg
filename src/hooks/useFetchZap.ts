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
    console.debug('event', event)
    console.debug('event.tags', event.tags)
    const pk = event.tags.find((t) => t[0] == 'p')
    console.debug('pk', pk, 'pubkey', pubkey)
    if (pk && pk[1] !== pubkey) return

    const bolt11 = event.tags.find((t) => t[0] == 'bolt11')
    console.debug('bolt11', bolt11, 'invoice', invoice)
    if (bolt11 && bolt11[1] == invoice) {
      setZap(event)
      callback()
    }
  }

  useEffect(() => {
    if (pubkey && invoice) {
      console.debug('subscribing for zap!')
      nostrClient.subscribe('zap', filters, onEventCallback)
      return () => {
        console.debug('unsubscribing????? from zap')
        nostrClient.unsubscribe('zap')
      }
    }
  }, [pubkey, invoice])

  return zap
}
