import { useEffect, useRef, useState } from 'react'
import { Filter, Event } from 'nostr-tools'
import { nostrClient } from '~/nostr/NostrClient'

// TODO: Need to prevent multiple fire when a new relay connects while
// fetching zap
export const useFetchZap = (id: string, pubkey: string | undefined, invoice: string | null, callback: () => void) => {
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

    // TODO: verify invoice amount === zap request amount

    const bolt11 = event.tags.find((t) => t[0] == 'bolt11')
    if (bolt11 && bolt11[1] == invoice) {
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
}
