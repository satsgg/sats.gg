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
  // TODO: Extend NostrRelay to have our self managed connected boolean
  connectedRelays: Set<string> = new Set()
  subscriptions: Map<string, SubInfo> = new Map()
  listeners: Set<Function> = new Set()

  addRelay(url: string) {
    const relay: NostrRelay = {
      ...relayInit(url),
      subs: new Map(),
    }
    this.relays.set(url, relay)

    relay.on('connect', () => {
      console.debug(relay.url, ' connected! status: ', relay.status)
      this.connectedRelays = new Set(this.connectedRelays).add(relay.url)

      this.listeners.forEach((listener) => listener(this.connectedRelays))

      for (const si of this.subscriptions.values()) {
        const sub = relay.sub(si.filters)
        // console.debug('on connect subscribing to : ' + si.id)
        sub.on('event', si.callback)
        relay.subs.set(si.id, sub)
      }
    })

    relay.on('disconnect', () => {
      console.warn(`🚪 nostr (${relay.url}): Connection closed.`)
      console.debug('connected relays before delete', this.connectedRelays)
      this.connectedRelays.delete(relay.url)
      console.debug('connected relays after delete', this.connectedRelays)
      this.connectedRelays = new Set(this.connectedRelays)
      console.debug('connected relays after delete in set', this.connectedRelays)
      this.listeners.forEach((listener) => listener(this.connectedRelays))
    })

    relay.on('error', () => {
      console.error(`failed to connect to ${relay.url}`)
    })

    relay.on('notice', (msg) => {
      console.debug(relay.url, ' notice', msg)
    })
  }

  removeRelay(url: string) {
    const relay = this.relays.get(url)
    if (!relay) {
      console.warn("Relay doesn't exist")
      return
    }

    // what if not connected?
    relay.close()
    this.connectedRelays.delete(relay.url)
    this.connectedRelays = new Set(this.connectedRelays)
    this.listeners.forEach((listener) => listener(this.connectedRelays))
    this.relays.delete(url)
  }

  connectToRelay(url: string) {
    const relay = this.relays.get(url)
    if (this.connectedRelays.has(url)) {
      console.debug(url, ' is already connected')
      return
    }
    if (!relay) {
      console.warn("Relay doesn't exist")
      return
    }
    try {
      console.debug('Connect to', relay)
      relay.connect()
    } catch (e: any) {
      console.error(relay.url, ' error connecting')
    }
  }

  // TODO: two ws connections are still opened up in strict mode..
  disconnectFromRelay(url: string) {
    const relay = this.relays.get(url)
    if (!relay) {
      console.warn("Relay doesn't exist")
      return
    }

    relay.close()
    this.connectedRelays.delete(relay.url)
    this.connectedRelays = new Set(this.connectedRelays)
    this.listeners.forEach((listener) => listener(this.connectedRelays))
    this.relays.delete(url)
  }

  addSubscription(id: string, filters: Filter[], eventCb: (event: Event) => void) {
    for (const cr of this.connectedRelays) {
      const r = this.relays.get(cr)
      const sub = r!.sub(filters)
      sub.on('event', eventCb)
      sub.on('eose', () => console.log('SUB EOSE: ', r!.url, ' ', id))

      r!.subs.set(id, sub)
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

  // useConnectedRelays sync external store subscribe function
  subscribe(listener: Function) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // TODO: Should return relays seen on or something...
  async publish(event: Event) {
    let ps: Promise<unknown>[] = []
    for (const cr of this.connectedRelays) {
      const r = this.relays.get(cr)
      if (!r) continue

      const publishWithTimeout = (millis: number) => {
        const timeout = new Promise((resolve, reject) => {
          setTimeout(() => reject(`${r.url} timed out after ${millis} ms`), millis)
        })

        const publish = new Promise((resolve, reject) => {
          r.publish(event)
            .then(() => resolve(`${r.url} published`))
            .catch((error) => reject(`${r.url} ${error}`))
        })

        return Promise.race([publish, timeout])
      }

      ps.push(publishWithTimeout(1000))
    }
    const results = await Promise.allSettled(ps)
    console.debug('publish results', results)
    return results
  }
}
