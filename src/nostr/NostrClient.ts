import RelayPool from './RelayPool'
import { Filter, Event, nip19 } from 'nostr-tools'
import Settings from '~/store/userSettingsStore'
import { db } from '~/store/db'

// TODO: Move interfaces to nostr/index.ts
export interface UserMetadata {
  name?: string
  // pubkey?: string
  // npub?: string
  display_name?: string
  picture?: string
  about?: string
  website?: string
  banner?: string
  lud06?: string
  lud16?: string
  nip05?: string
}

export type UserMetadataStore = UserMetadata & {
  pubkey?: string
  npub?: string
}

class NostrClient {
  relayPool: RelayPool
  profileQueue: Set<string> = new Set() // set of hex public keys to query
  paused: boolean = false

  // want to initiate this client with relays from the user's settings
  // so want a store for user settings
  // if no user settings set to default list of relays
  // constructor needs to run after user settings store is initiated.

  // NostrStore
  //  - user settings store slice
  //    * relays
  //    * public/private key
  //  - events/notes store?
  //    * profiles
  //    * following list
  // - NostrClient
  //    * client saved in top level NostrStore
  //    * initiated after user settings slice

  constructor(relays: string[]) {
    this.relayPool = new RelayPool(relays)
  }

  async connect() {
    // TODO: parallel with promises
    await this.relayPool.connect()
  }

  subscribe(id: string, filters: Filter[], eventCb: (event: Event) => void) {
    this.relayPool.addSubscription(id, filters, eventCb)
  }

  unsubscribe(id: string) {
    console.log('unsubscribing')
    this.relayPool.removeSubscription(id)
  }

  addProfileToFetch(pubkey: string) {
    this.profileQueue.add(pubkey)
    this._fetchPubkeys()
  }

  removeProfileToFetch(pubkey: string) {
    this.profileQueue.delete(pubkey)
  }

  // issue would be if paused was false and multiple messages arrived within pause window
  // first pubkey would be fetched and would pause the function.
  // remaining pubkeys wouldn't be fetched until another message comes in, which could be
  // any time later.
  // if (paused) setTimeout(fetchPubkeys, 500) // would cause infinite loop?
  // https://underscorejs.org/docs/modules/throttle.html
  _fetchPubkeys() {
    if (this.paused || this.profileQueue.size === 0) return

    const filters: Filter[] = [
      {
        kinds: [0],
        authors: Array.from(this.profileQueue),
      },
    ]
    console.log('subscribing for pubkeys: ', Array.from(this.profileQueue))

    const callback = async (event: Event) => {
      const metadataContent: UserMetadata = JSON.parse(event.content)
      const metadataStore: UserMetadataStore = {
        ...metadataContent,
        pubkey: event.pubkey,
        npub: nip19.npubEncode(event.pubkey),
      }
      await db.users.put(metadataStore)
    }

    // fetch with promises? want to close this.unsubscribe() when one relay returns info...
    this.subscribe('profiles', filters, callback)
    for (let pubkey of this.profileQueue) {
      this.profileQueue.delete(pubkey)
    }

    this.paused = true
    setTimeout(() => {
      this.paused = false
    }, 500)
  }

  // TODO: Remove relay

  publish() {}
}

// NOTE: This might stop working once we start reading relays from localStorage (async?)
// could become a race condition...
// could just initialize settings store and then initialize nostr client
// during useEffect in DefaultLayout
export const nostrClient = new NostrClient(Settings.getState().relays)
