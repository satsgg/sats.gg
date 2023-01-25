import create from 'zustand/vanilla'
import { relayInit, Relay, Filter, Sub, Event } from 'nostr-tools'

type MetaSubscription = {
  id: string
  filters: Filter[]
  callback: (event: Event) => void
  subs: Set<Sub>
}

type State = {
  connectedRelays: Map<string, Relay>
  subscriptions: Map<string, MetaSubscription>
}

const hi = 'hi'
console.log(hi)

type Actions = {
  connectToRelay: (relayUrl: string) => void
  disconnectRelay: (addr: string) => void
  addSubscription: (filters: Filter[], eventCb: (event: Event) => void, id: string) => void
  removeSubscription: (id: string) => void
  publish: (event: Event) => void
}

const initialState: State = {
  connectedRelays: new Map(),
  subscriptions: new Map(),
}

const nostrStore = create<State & Actions>((set, get) => ({
  // TODO: Make initialize function that reads from settings state (TODO).
  // settings state will contain the initial set of user relays if cached in localstorage
  ...initialState,

  connectToRelay: async (relayUrl) => {
    if (!get().connectedRelays.has(relayUrl)) {
      const relay = relayInit(relayUrl)
      try {
        await relay.connect()
      } catch (e) {
        console.error('Error connecting to relay: ', e)
      }

      relay.on('connect', () => {
        console.debug(`✅ nostr (${relayUrl}): Connected!`)
        set((prev) => ({ connectedRelays: new Map(prev.connectedRelays).set(relayUrl, relay) }))

        for (const subscription of get().subscriptions.values()) {
          console.debug(relay.url, ': ', 'on connect adding subs: ', subscription)
          const sub = relay.sub(subscription.filters)

          sub.on('event', subscription.callback)
          sub.on('eose', (eose: any) => {
            console.log('eose: ', eose)
          })

          set((prev) => {
            let newMap = new Map(prev.subscriptions)
            newMap.get(subscription.id)?.subs.add(sub)
            return { subscriptions: newMap }
          })
        }
      })

      relay.on('disconnect', () => {
        console.warn(`🚪 nostr (${relayUrl}): Connection closed.`)
        // TODO: Back off reconnect? Issue is calling purposefully calling disconnectRelay will
        // trigger reconnect handler... so wouldn't be able to disconnect
        set((prev) => {
          let newMap = new Map(prev.connectedRelays)
          newMap.delete(relayUrl)
          return { connectedRelays: newMap }
        })
      })

      relay.on('error', () => {
        console.log(`❌ nostr (${relayUrl}): Connection error!`)
      })
    }
  },

  disconnectRelay: async (addr) => {
    const relay = get().connectedRelays.get(addr)
    if (get().connectedRelays.delete(addr)) {
      console.debug(`🚫 nostr (${addr}): disconnected`)
      await relay?.close()
    }
  },

  addSubscription: (filters, eventCb, id) => {
    console.debug(`📭 adding subscription with filter:`, filters)

    // Add subscription information to subscriptions map

    const subs = Array.from(get().connectedRelays.values()).map((relay) => {
      const sub = relay.sub(filters)
      sub.on('event', eventCb)
      sub.on('eose', (eose: any) => {
        console.log('eose: ', eose)
      })
      return sub
    })

    let ms: MetaSubscription = { id: id, filters: filters, callback: eventCb, subs: new Set(subs) }
    set((prev) => ({ subscriptions: new Map(prev.subscriptions).set(id, ms) }))
  },

  removeSubscription: (id) => {
    console.debug(`removing subscriptions`)
    get()
      .subscriptions.get(id)
      ?.subs.forEach((sub) => {
        // what happens if a sub already cancelled itself?
        sub.unsub()
      })

    set((prev) => {
      let newMap = new Map(prev.subscriptions)
      newMap.delete(id)
      return { subscriptions: newMap }
    })
  },

  publish: (event) => {
    console.debug(`📩 publishing event: ${event}`)
    // NOTE: in tsconfig.json had to convert es5 -> es6.... don't know if bad
    // can get values other ways
    // caniuse.com -> es6 shows less browsers can run this
    for (const relay of get().connectedRelays.values()) {
      let pub = relay.publish(event)
      pub?.on('ok', () => {
        console.debug(`👍 ${relay.url} has accepted our event`)
      })
      pub?.on('seen', () => {
        console.debug(`👀 we saw the event on ${relay.url}`)
      })
      pub?.on('failed', (reason: any) => {
        console.debug(`❌ failed to publish to ${relay.url}: ${reason}`)
      })
    }
  },
}))

export default nostrStore
