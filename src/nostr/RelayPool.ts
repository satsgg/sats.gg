import { Relay, relayInit, Sub, Filter, Event } from 'nostr-tools'

type SubInfo = {
  id: string
  filters: Filter[]
  callback: (event: Event) => void
}

type NostrRelay = Relay & {
  subs: Map<string, Sub>
}

// abstracts out multiple relays into single operations
// loops through relays for publishing, collects results from relays,
// manages the relay connections and ensures minimum/maximums etc
export default class RelayPool {
  relays: Map<string, NostrRelay> = new Map()
  subscriptions: Map<string, SubInfo> = new Map()

  constructor(urls: string[]) {
    urls.forEach((url) => {
      const relay: NostrRelay = {
        ...relayInit(url),
        subs: new Map(),
      }
      this.relays.set(url, relay)
    })
  }

  connect() {
    console.log('relays: ', Array.from(this.relays.keys()))
    for (const relay of this.relays.values()) {
      try {
        relay.connect()
      } catch (e: any) {
        console.error(relay.url, ' error connecting')
      }

      relay.on('connect', () => {
        for (const si of this.subscriptions.values()) {
          const sub = relay.sub(si.filters)
          sub.on('event', si.callback)
          relay.subs.set(si.id, sub)
        }
      })

      relay.on('disconnect', () => {
        console.warn(`🚪 nostr (${relay.url}): Connection closed.`)
        this.relays.delete(relay.url)
      })

      relay.on('error', (error: string) => {
        console.error(relay.url, ' error connecting: ', error)
      })

      relay.on('notice', () => {
        console.debug(relay.url, ' notice')
      })
    }
  }

  addSubscription(id: string, filters: Filter[], eventCb: (event: Event) => void) {
    console.debug(`📭 adding subscription with filter:`, filters)

    for (const r of this.connectedRelays()) {
      const sub = r.sub(filters)
      sub.on('event', eventCb)
      //sub.on('eose', () => console.log('SUB EOSE: ', relay.url, ' ', id))

      r.subs.set(id, sub)
    }

    this.subscriptions.set(id, {
      id: id,
      filters: filters,
      callback: eventCb,
    })
  }

  removeSubscription(id: string) {
    if (!this.subscriptions.has(id)) {
      console.warn(id, 'not found in subscriptions')
      return
    }

    for (const r of this.relays.values()) {
      if (r.subs.has(id)) {
        r.subs.get(id)!.unsub()
        r.subs.delete(id)
      }
    }

    this.subscriptions.delete(id)
    // NOTE: EOSE must work together with removing subscription and sub.unsub..
  }

  connectedRelays() {
    return Array.from(this.relays.values()).filter((relay) => relay.status === 1)
  }

  // relayStatus() {
  //   for (const relay of this.relays.values()) {
  //     console.log(relay.url, ': ', relay.status)
  //   }
  // }
}
